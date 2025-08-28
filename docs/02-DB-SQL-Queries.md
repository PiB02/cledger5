> 🚫 **IMMUTABLE** — Toute modif via PR + revue CTO. 


-- =========================
-- Top-K CV pour une offre (ANN + gating + overlap compétences)
-- =========================

-- :offer_id :: uuid, :k :: int (ex: 50)
with params as (
  select :offer_id::uuid as offer_id, coalesce(:k,50)::int as k
),
cfg as (
  select * from scoring_config where version='v1'
),
off as (
  select o.*, oe.embedding
  from offers o
  join offer_embeddings oe on oe.offer_id=o.id and oe.kind='semantic'
  where o.id=(select offer_id from params)
),
-- voisins ANN sur embeddings (cosine)
nn as (
  select ce.cv_id,
         (1 - (ce.embedding <=> (select embedding from off)))::real as ann_sim
  from cv_embeddings ce
  order by ce.embedding <=> (select embedding from off) asc
  limit (select k_candidates from cfg)
),
-- base CV filtrée
cvb as (
  select p.*
  from cv_profiles p
  join nn on nn.cv_id=p.id
  where p.is_searchable=true and p.deleted_at is null and p.anonymized_at is null
),
-- exigences offre
req as (
  select r.* from offer_requirements r where r.offer_id=(select offer_id from params)
),
olang as (
  select l.* from offer_languages l where l.offer_id=(select offer_id from params) and l.required
),
-- skills offre pondérés
osk as (
  select lower(unaccent(skill_label)) as s, type,
         case when type='required' then 1.0 else 0.5 end as w
  from offer_skills
  where offer_id=(select offer_id from params) and type in ('required','preferred')
),
-- skills CV normalisés
cv_sk as (
  select cs.cv_id, lower(unaccent(cs.skill_label)) as s
  from cv_skills cs
  join cvb using(cv_id)
),
-- overlap pondéré
skill_scores as (
  select
    c.cv_id,
    coalesce(sum(o.w) filter (where c.s is not null and c.s = o.s),0)::real / nullif(sum(o.w),0)::real as skill_overlap,
    array_agg(o.s order by o.type desc) filter (where exists (select 1 from cv_skills x where x.cv_id=c.cv_id and lower(unaccent(x.skill_label))=o.s)) as matched_skills,
    array_agg(o.s order by o.type desc) filter (where o.type='required' and not exists (select 1 from cv_skills x where x.cv_id=c.cv_id and lower(unaccent(x.skill_label))=o.s)) as missing_required
  from osk o
  cross join (select distinct cv_id, s from cv_sk) c
  group by c.cv_id
),
-- diplômes et langues
cv_max_degree as (
  select cv_id, max(eqf_level) as max_eqf from cv_degrees group by cv_id
),
lang_gate as (
  select p.id as cv_id,
         not exists (
           select 1 from olang ol
           where not exists (
             select 1 from cv_languages cl
             where cl.cv_id=p.id and cl.lang_code=ol.lang_code and cl.cefr >= ol.min_cefr
           )
         ) as langs_ok
  from cvb p
),
-- géo
geo_scores as (
  select p.id as cv_id,
         case
           when (select remote_allowed from req) then 1.0
           when p.location_id is null or (select location_id from off) is null then 0.5
           else (
             case
               when (select mobility_km from req) is null then 1.0
               else
                 least(1.0,
                   greatest(0.0,
                     1.0 - (st_distanceSphere(lc.geo, lo.geo)/1000.0) / greatest( (select mobility_km from req), 1)
                   )
                 )
             end
           )
         end::real as geo_score
  from cvb p
  left join locations lc on lc.id=p.location_id
  left join locations lo on lo.id=(select location_id from off)
),
-- gating
gating as (
  select
    p.id as cv_id,
    ( (select degree_min_eqf from req) is null
      or exists (select 1 from cv_max_degree d where d.cv_id=p.id and d.max_eqf >= (select degree_min_eqf from req))
    ) as degree_ok,
    ( (select min_years_exp from req) is null
      or p.seniority_years is null
      or p.seniority_years >= (select min_years_exp from req)
    ) as years_ok
  from cvb p
),
scores as (
  select
    p.id as cv_id,
    (select ann_sim from nn where nn.cv_id=p.id) as ann_sim,
    coalesce(ss.skill_overlap,0)::real as skill_overlap,
    gs.geo_score,
    -- gating policy
    (
      (g.degree_ok and lg.langs_ok) and
      (case when (select underexp_policy from cfg)='gate'
            then g.years_ok
            else true end)
    ) as gating_ok
  from cvb p
  left join skill_scores ss on ss.cv_id=p.id
  left join geo_scores gs on gs.cv_id=p.id
  left join gating g on g.cv_id=p.id
  left join lang_gate lg on lg.cv_id=p.id
),
final as (
  select
    s.cv_id,
    s.gating_ok,
    s.ann_sim,
    s.skill_overlap,
    s.geo_score,
    ( (select w_ann from cfg)*s.ann_sim
    + (select w_skill from cfg)*coalesce(s.skill_overlap,0)
    + (select w_geo from cfg)*coalesce(s.geo_score,0) )::real as final_score,
    coalesce(ss.matched_skills,'{}') as matched_skills,
    coalesce(ss.missing_required,'{}') as missing_required
  from scores s
  left join skill_scores ss on ss.cv_id=s.cv_id
)
select f.*
from final f
where f.gating_ok
order by f.final_score desc
limit (select k from params);


-- =========================
-- Insertion du run + des scores (transaction)
-- =========================

-- :offer_id :: uuid, :k :: int
begin;
  insert into match_runs(scoring_version, query_kind)
  values ('v1','offer_to_cv')
  returning id into :run_id;

  insert into match_scores(run_id, cv_id, offer_id, gating_ok, ann_score, skill_overlap, geo_score, final_score, features, explanation_cv, explanation_offer)
  select
    :run_id,
    q.cv_id,
    :offer_id,
    q.gating_ok,
    q.ann_sim,
    q.skill_overlap,
    q.geo_score,
    q.final_score,
    jsonb_build_object(
      'matched_skills', q.matched_skills,
      'missing_required', q.missing_required
    ),
    -- explications côté CV / offre
    format(
      'Forces: %s. Manques requis: %s.',
      array_to_string(q.matched_skills, ', '),
      case when cardinality(q.missing_required)=0 then 'aucun' else array_to_string(q.missing_required, ', ') end
    ),
    format(
      'Fit compétences=%.2f, ANN=%.2f, Géo=%.2f.',
      coalesce(q.skill_overlap,0), coalesce(q.ann_sim,0), coalesce(q.geo_score,0)
    )
  from (
    -- réutilise la requête précédente en la remplaçant par SELECT final ...
    with _ as (select 1)
    select * from (
      /* PLACE ICI le bloc "Top-K CV pour une offre" en sous-requête et remplace le SELECT final f.* par SELECT f.* */
    ) t
  ) q
  order by q.final_score desc
  limit coalesce(:k,50);
commit;




-- =========================
-- Top-K offres pour un CV (miroir)
-- =========================

-- :cv_id :: uuid, :k :: int
with params as (
  select :cv_id::uuid as cv_id, coalesce(:k,50)::int as k
),
cfg as ( select * from scoring_config where version='v1'),
cv as (
  select p.*, ce.embedding
  from cv_profiles p
  join cv_embeddings ce on ce.cv_id=p.id and ce.kind='semantic'
  where p.id=(select cv_id from params) and p.deleted_at is null and p.anonymized_at is null
),
nn as (
  select oe.offer_id,
         (1 - (oe.embedding <=> (select embedding from cv)))::real as ann_sim
  from offer_embeddings oe
  order by oe.embedding <=> (select embedding from cv) asc
  limit (select k_candidates from cfg)
),
-- exigences offre + gating
req as (select * from offer_requirements where offer_id in (select offer_id from nn)),
olang as (select * from offer_languages where offer_id in (select offer_id from nn) and required),
cv_degree as (select max(eqf_level) as max_eqf from cv_degrees where cv_id=(select cv_id from params)),
cv_lang as (select lang_code, max(cefr) as cefr from cv_languages where cv_id=(select cv_id from params) group by lang_code),
geo_scores as (
  select
    o.id as offer_id,
    case
      when r.remote_allowed then 1.0
      when (select location_id from cv) is null or o.location_id is null then 0.5
      else (
        case when r.mobility_km is null then 1.0
             else least(1.0, greatest(0.0,
                   1.0 - (st_distanceSphere(lo.geo, lc.geo)/1000.0)/greatest(r.mobility_km,1)))
        end
      )
    end::real as geo_score
  from offers o
  left join offer_requirements r on r.offer_id=o.id
  left join locations lo on lo.id=o.location_id
  left join locations lc on lc.id=(select location_id from cv)
  where o.id in (select offer_id from nn)
),
skill_scores as (
  -- overlap pondéré requis/préféré
  with cv_s as (
    select lower(unaccent(skill_label)) as s from cv_skills where cv_id=(select cv_id from params)
  ),
  os as (
    select offer_id,
           lower(unaccent(skill_label)) as s,
           type,
           case when type='required' then 1.0 else 0.5 end as w
    from offer_skills where offer_id in (select offer_id from nn) and type in ('required','preferred')
  )
  select
    o.offer_id,
    coalesce(sum(o.w) filter (where exists (select 1 from cv_s where cv_s.s=o.s)),0)::real / nullif(sum(o.w),0)::real as skill_overlap,
    array_agg(o.s) filter (where exists (select 1 from cv_s where cv_s.s=o.s)) as matched_skills,
    array_agg(o.s) filter (where o.type='required' and not exists (select 1 from cv_s where cv_s.s=o.s)) as missing_required
  from os o
  group by o.offer_id
),
gating as (
  select
    n.offer_id,
    -- diplômes
    (not exists (select 1 from req r where r.offer_id=n.offer_id and r.degree_min_eqf is not null)
     or (select max_eqf from cv_degree) >= (select degree_min_eqf from req r where r.offer_id=n.offer_id)) as degree_ok,
    -- années
    (not exists (select 1 from req r where r.offer_id=n.offer_id and r.min_years_exp is not null)
     or (select seniority_years from cv) >= (select min_years_exp from req r where r.offer_id=n.offer_id)) as years_ok,
    -- langues
    not exists (
      select 1 from olang l
      where l.offer_id=n.offer_id
        and not exists (select 1 from cv_lang cl where cl.lang_code=l.lang_code and cl.cefr >= l.min_cefr)
    ) as langs_ok
  from nn n
),
final as (
  select
    n.offer_id,
    (g.degree_ok and g.langs_ok and case when (select underexp_policy from cfg)='gate' then g.years_ok else true end) as gating_ok,
    n.ann_sim,
    coalesce(ss.skill_overlap,0)::real as skill_overlap,
    gs.geo_score,
    ( (select w_ann from cfg)*n.ann_sim
    + (select w_skill from cfg)*coalesce(ss.skill_overlap,0)
    + (select w_geo from cfg)*coalesce(gs.geo_score,0) )::real as final_score,
    coalesce(ss.matched_skills,'{}') as matched_skills,
    coalesce(ss.missing_required,'{}') as missing_required
  from nn n
  left join skill_scores ss on ss.offer_id=n.offer_id
  left join geo_scores gs on gs.offer_id=n.offer_id
  left join gating g on g.offer_id=n.offer_id
)
select f.*
from final f
where f.gating_ok
order by f.final_score desc
limit (select k from params);


-- =========================
-- Recherche par rayon fiable (coordonnées ou CV)
-- =========================

-- A) autour d’un point (:lon, :lat, :radius_km)
select
  o.id, o.title, c.name as company, l.city, l.postal_code,
  (st_distanceSphere(l.geo, st_setsrid(st_makepoint(:lon,:lat),4326))/1000.0)::numeric(10,2) as km
from offers o
join locations l on l.id=o.location_id
left join companies c on c.id=o.company_id
where o.status='active'
  and l.geo is not null
  and st_dwithin(l.geo, st_setsrid(st_makepoint(:lon,:lat),4326), (:radius_km*1000)::double precision)
order by km asc
limit 100;

-- B) autour d’un CV donné (:cv_id, :radius_km)
select
  o.id, o.title, c.name as company, l.city, l.postal_code,
  (st_distanceSphere(l.geo, lc.geo)/1000.0)::numeric(10,2) as km
from cv_profiles p
join locations lc on lc.id=p.location_id
join offers o on o.status='active'
join locations l on l.id=o.location_id
left join companies c on c.id=o.company_id
where p.id=:cv_id
  and lc.geo is not null and l.geo is not null
  and st_dwithin(l.geo, lc.geo, (:radius_km*1000)::double precision)
order by km asc
limit 100;



-- =========================
-- Création des partitions “mois suivant” (raw + match_scores part.)
-- =========================

-- RAW: crée la partition du mois prochain
select ensure_offers_raw_partition( (date_trunc('month', now()) + interval '1 month')::date );

-- match_scores partitionné (si tu as activé la variante partitionnée)
do $$
declare m date := date_trunc('month', now())::date + interval '1 month';
begin
  execute format(
    'create table if not exists %I partition of match_scores for values from (%L) to (%L);',
    'match_scores_'||to_char(m,'YYYY_MM'),
    m::timestamptz, (m + interval '1 month')::timestamptz
  );
end $$;


-- =========================
-- Latence parsing CV et ingestion offres (ad hoc)
-- =========================

-- Latence moyenne parsing CV sur 24h
select avg(extract(epoch from (r.completed_at - d.uploaded_at))) as avg_seconds
from cv_parse_runs r
join cv_profiles p on p.id=r.cv_id
join cv_documents d on d.id=p.document_id
where r.status='ok' and r.completed_at >= now() - interval '24 hours';

-- Débit moyenne ingest par source sur 24h
select source_id, avg(duration_seconds) as avg_sec, sum(upserted_count) as upserts
from ingest_runs_offers
where started_at >= now() - interval '24 hours'
group by source_id;




-- =========================
-- Explainer “pourquoi ce match” à partir de match_scores
-- =========================

-- :run_id :: uuid, :cv_id :: uuid, :offer_id :: uuid
select
  m.final_score,
  (m.features->'matched_skills')::text   as matched_skills,
  (m.features->'missing_required')::text as missing_required,
  m.explanation_cv,
  m.explanation_offer
from match_scores m
where m.run_id=:run_id and m.cv_id=:cv_id and m.offer_id=:offer_id;


-- =========================
-- Logguer un code source non mappé (amélioration continue)
-- =========================

select log_unmapped('FT','contract_type','CONTRAT SAISONNIER', :offer_id);


