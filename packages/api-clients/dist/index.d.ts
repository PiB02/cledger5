import { z } from 'zod';

declare const LBAOfferSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    company: z.ZodOptional<z.ZodObject<{
        name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        siret: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        size: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        description?: string | null | undefined;
        name?: string | null | undefined;
        siret?: string | null | undefined;
        size?: string | null | undefined;
    }, {
        description?: string | null | undefined;
        name?: string | null | undefined;
        siret?: string | null | undefined;
        size?: string | null | undefined;
    }>>;
    place: z.ZodOptional<z.ZodObject<{
        city: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        postalCode: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        zipCode: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        department: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        region: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        inseeCode: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        latitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        longitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        distance: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        fullAddress: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        address: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        city?: string | null | undefined;
        postalCode?: string | null | undefined;
        zipCode?: string | null | undefined;
        department?: string | null | undefined;
        region?: string | null | undefined;
        inseeCode?: string | null | undefined;
        latitude?: number | null | undefined;
        longitude?: number | null | undefined;
        distance?: number | null | undefined;
        fullAddress?: string | null | undefined;
        address?: string | null | undefined;
    }, {
        city?: string | null | undefined;
        postalCode?: string | null | undefined;
        zipCode?: string | null | undefined;
        department?: string | null | undefined;
        region?: string | null | undefined;
        inseeCode?: string | null | undefined;
        latitude?: number | null | undefined;
        longitude?: number | null | undefined;
        distance?: number | null | undefined;
        fullAddress?: string | null | undefined;
        address?: string | null | undefined;
    }>>;
    contract: z.ZodOptional<z.ZodObject<{
        type: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        duration: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        workMode: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        type?: string | null | undefined;
        duration?: number | null | undefined;
        workMode?: string | null | undefined;
    }, {
        type?: string | null | undefined;
        duration?: number | null | undefined;
        workMode?: string | null | undefined;
    }>>;
    job: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        contractType: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        creationDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        jobStartDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        jobExpirationDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        romeDetails: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        id?: string | null | undefined;
        description?: string | null | undefined;
        contractType?: string | null | undefined;
        creationDate?: string | null | undefined;
        jobStartDate?: string | null | undefined;
        jobExpirationDate?: string | null | undefined;
        romeDetails?: any;
    }, {
        id?: string | null | undefined;
        description?: string | null | undefined;
        contractType?: string | null | undefined;
        creationDate?: string | null | undefined;
        jobStartDate?: string | null | undefined;
        jobExpirationDate?: string | null | undefined;
        romeDetails?: any;
    }>>;
    salary: z.ZodOptional<z.ZodObject<{
        min: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        max: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        period: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        description?: string | null | undefined;
        min?: number | null | undefined;
        max?: number | null | undefined;
        period?: string | null | undefined;
    }, {
        description?: string | null | undefined;
        min?: number | null | undefined;
        max?: number | null | undefined;
        period?: string | null | undefined;
    }>>;
    rome_codes: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString, "many">>>;
    naf_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    skills: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString, "many">>>;
    nafs: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodAny, "many">>>;
    degree_min: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    experience_min: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    languages: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodObject<{
        language: z.ZodString;
        level: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        language: string;
        level?: string | null | undefined;
    }, {
        language: string;
        level?: string | null | undefined;
    }>, "many">>>;
    apply_url: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    apply_phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    apply_email: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    published_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    updated_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    expires_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    ideaType: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    contact: z.ZodOptional<z.ZodAny>;
    target_diploma_level: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    rythmeAlternance: z.ZodOptional<z.ZodNullable<z.ZodAny>>;
    elligibleHandicap: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    dureeContrat: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    quantiteContrat: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    status: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    type: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString, "many">>>;
    recipient_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    url: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    applicationCount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    token: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    title: string;
    description?: string | null | undefined;
    type?: string[] | null | undefined;
    status?: string | null | undefined;
    company?: {
        description?: string | null | undefined;
        name?: string | null | undefined;
        siret?: string | null | undefined;
        size?: string | null | undefined;
    } | undefined;
    place?: {
        city?: string | null | undefined;
        postalCode?: string | null | undefined;
        zipCode?: string | null | undefined;
        department?: string | null | undefined;
        region?: string | null | undefined;
        inseeCode?: string | null | undefined;
        latitude?: number | null | undefined;
        longitude?: number | null | undefined;
        distance?: number | null | undefined;
        fullAddress?: string | null | undefined;
        address?: string | null | undefined;
    } | undefined;
    contract?: {
        type?: string | null | undefined;
        duration?: number | null | undefined;
        workMode?: string | null | undefined;
    } | undefined;
    job?: {
        id?: string | null | undefined;
        description?: string | null | undefined;
        contractType?: string | null | undefined;
        creationDate?: string | null | undefined;
        jobStartDate?: string | null | undefined;
        jobExpirationDate?: string | null | undefined;
        romeDetails?: any;
    } | undefined;
    salary?: {
        description?: string | null | undefined;
        min?: number | null | undefined;
        max?: number | null | undefined;
        period?: string | null | undefined;
    } | undefined;
    rome_codes?: string[] | null | undefined;
    naf_code?: string | null | undefined;
    skills?: string[] | null | undefined;
    nafs?: any[] | null | undefined;
    degree_min?: string | null | undefined;
    experience_min?: number | null | undefined;
    languages?: {
        language: string;
        level?: string | null | undefined;
    }[] | null | undefined;
    apply_url?: string | null | undefined;
    apply_phone?: string | null | undefined;
    apply_email?: string | null | undefined;
    published_at?: string | null | undefined;
    updated_at?: string | null | undefined;
    expires_at?: string | null | undefined;
    ideaType?: string | null | undefined;
    contact?: any;
    target_diploma_level?: string | null | undefined;
    rythmeAlternance?: any;
    elligibleHandicap?: boolean | null | undefined;
    dureeContrat?: string | null | undefined;
    quantiteContrat?: number | null | undefined;
    recipient_id?: string | null | undefined;
    url?: string | null | undefined;
    applicationCount?: number | null | undefined;
    token?: string | null | undefined;
}, {
    id: string;
    title: string;
    description?: string | null | undefined;
    type?: string[] | null | undefined;
    status?: string | null | undefined;
    company?: {
        description?: string | null | undefined;
        name?: string | null | undefined;
        siret?: string | null | undefined;
        size?: string | null | undefined;
    } | undefined;
    place?: {
        city?: string | null | undefined;
        postalCode?: string | null | undefined;
        zipCode?: string | null | undefined;
        department?: string | null | undefined;
        region?: string | null | undefined;
        inseeCode?: string | null | undefined;
        latitude?: number | null | undefined;
        longitude?: number | null | undefined;
        distance?: number | null | undefined;
        fullAddress?: string | null | undefined;
        address?: string | null | undefined;
    } | undefined;
    contract?: {
        type?: string | null | undefined;
        duration?: number | null | undefined;
        workMode?: string | null | undefined;
    } | undefined;
    job?: {
        id?: string | null | undefined;
        description?: string | null | undefined;
        contractType?: string | null | undefined;
        creationDate?: string | null | undefined;
        jobStartDate?: string | null | undefined;
        jobExpirationDate?: string | null | undefined;
        romeDetails?: any;
    } | undefined;
    salary?: {
        description?: string | null | undefined;
        min?: number | null | undefined;
        max?: number | null | undefined;
        period?: string | null | undefined;
    } | undefined;
    rome_codes?: string[] | null | undefined;
    naf_code?: string | null | undefined;
    skills?: string[] | null | undefined;
    nafs?: any[] | null | undefined;
    degree_min?: string | null | undefined;
    experience_min?: number | null | undefined;
    languages?: {
        language: string;
        level?: string | null | undefined;
    }[] | null | undefined;
    apply_url?: string | null | undefined;
    apply_phone?: string | null | undefined;
    apply_email?: string | null | undefined;
    published_at?: string | null | undefined;
    updated_at?: string | null | undefined;
    expires_at?: string | null | undefined;
    ideaType?: string | null | undefined;
    contact?: any;
    target_diploma_level?: string | null | undefined;
    rythmeAlternance?: any;
    elligibleHandicap?: boolean | null | undefined;
    dureeContrat?: string | null | undefined;
    quantiteContrat?: number | null | undefined;
    recipient_id?: string | null | undefined;
    url?: string | null | undefined;
    applicationCount?: number | null | undefined;
    token?: string | null | undefined;
}>;
type LBAOffer = z.infer<typeof LBAOfferSchema>;
declare const LBAResponseSchema: z.ZodObject<{
    peJobs: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        results: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            title: z.ZodString;
            description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            company: z.ZodOptional<z.ZodObject<{
                name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                siret: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                size: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "strip", z.ZodTypeAny, {
                description?: string | null | undefined;
                name?: string | null | undefined;
                siret?: string | null | undefined;
                size?: string | null | undefined;
            }, {
                description?: string | null | undefined;
                name?: string | null | undefined;
                siret?: string | null | undefined;
                size?: string | null | undefined;
            }>>;
            place: z.ZodOptional<z.ZodObject<{
                city: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                postalCode: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                zipCode: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                department: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                region: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                inseeCode: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                latitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                longitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                distance: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                fullAddress: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                address: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "strip", z.ZodTypeAny, {
                city?: string | null | undefined;
                postalCode?: string | null | undefined;
                zipCode?: string | null | undefined;
                department?: string | null | undefined;
                region?: string | null | undefined;
                inseeCode?: string | null | undefined;
                latitude?: number | null | undefined;
                longitude?: number | null | undefined;
                distance?: number | null | undefined;
                fullAddress?: string | null | undefined;
                address?: string | null | undefined;
            }, {
                city?: string | null | undefined;
                postalCode?: string | null | undefined;
                zipCode?: string | null | undefined;
                department?: string | null | undefined;
                region?: string | null | undefined;
                inseeCode?: string | null | undefined;
                latitude?: number | null | undefined;
                longitude?: number | null | undefined;
                distance?: number | null | undefined;
                fullAddress?: string | null | undefined;
                address?: string | null | undefined;
            }>>;
            contract: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                duration: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                workMode: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "strip", z.ZodTypeAny, {
                type?: string | null | undefined;
                duration?: number | null | undefined;
                workMode?: string | null | undefined;
            }, {
                type?: string | null | undefined;
                duration?: number | null | undefined;
                workMode?: string | null | undefined;
            }>>;
            job: z.ZodOptional<z.ZodObject<{
                id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                contractType: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                creationDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                jobStartDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                jobExpirationDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                romeDetails: z.ZodOptional<z.ZodAny>;
            }, "strip", z.ZodTypeAny, {
                id?: string | null | undefined;
                description?: string | null | undefined;
                contractType?: string | null | undefined;
                creationDate?: string | null | undefined;
                jobStartDate?: string | null | undefined;
                jobExpirationDate?: string | null | undefined;
                romeDetails?: any;
            }, {
                id?: string | null | undefined;
                description?: string | null | undefined;
                contractType?: string | null | undefined;
                creationDate?: string | null | undefined;
                jobStartDate?: string | null | undefined;
                jobExpirationDate?: string | null | undefined;
                romeDetails?: any;
            }>>;
            salary: z.ZodOptional<z.ZodObject<{
                min: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                max: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                period: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "strip", z.ZodTypeAny, {
                description?: string | null | undefined;
                min?: number | null | undefined;
                max?: number | null | undefined;
                period?: string | null | undefined;
            }, {
                description?: string | null | undefined;
                min?: number | null | undefined;
                max?: number | null | undefined;
                period?: string | null | undefined;
            }>>;
            rome_codes: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString, "many">>>;
            naf_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            skills: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString, "many">>>;
            nafs: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodAny, "many">>>;
            degree_min: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            experience_min: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            languages: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodObject<{
                language: z.ZodString;
                level: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "strip", z.ZodTypeAny, {
                language: string;
                level?: string | null | undefined;
            }, {
                language: string;
                level?: string | null | undefined;
            }>, "many">>>;
            apply_url: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            apply_phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            apply_email: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            published_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            updated_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            expires_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ideaType: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            contact: z.ZodOptional<z.ZodAny>;
            target_diploma_level: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            rythmeAlternance: z.ZodOptional<z.ZodNullable<z.ZodAny>>;
            elligibleHandicap: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
            dureeContrat: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            quantiteContrat: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            status: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            type: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString, "many">>>;
            recipient_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            url: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            applicationCount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            token: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            title: string;
            description?: string | null | undefined;
            type?: string[] | null | undefined;
            status?: string | null | undefined;
            company?: {
                description?: string | null | undefined;
                name?: string | null | undefined;
                siret?: string | null | undefined;
                size?: string | null | undefined;
            } | undefined;
            place?: {
                city?: string | null | undefined;
                postalCode?: string | null | undefined;
                zipCode?: string | null | undefined;
                department?: string | null | undefined;
                region?: string | null | undefined;
                inseeCode?: string | null | undefined;
                latitude?: number | null | undefined;
                longitude?: number | null | undefined;
                distance?: number | null | undefined;
                fullAddress?: string | null | undefined;
                address?: string | null | undefined;
            } | undefined;
            contract?: {
                type?: string | null | undefined;
                duration?: number | null | undefined;
                workMode?: string | null | undefined;
            } | undefined;
            job?: {
                id?: string | null | undefined;
                description?: string | null | undefined;
                contractType?: string | null | undefined;
                creationDate?: string | null | undefined;
                jobStartDate?: string | null | undefined;
                jobExpirationDate?: string | null | undefined;
                romeDetails?: any;
            } | undefined;
            salary?: {
                description?: string | null | undefined;
                min?: number | null | undefined;
                max?: number | null | undefined;
                period?: string | null | undefined;
            } | undefined;
            rome_codes?: string[] | null | undefined;
            naf_code?: string | null | undefined;
            skills?: string[] | null | undefined;
            nafs?: any[] | null | undefined;
            degree_min?: string | null | undefined;
            experience_min?: number | null | undefined;
            languages?: {
                language: string;
                level?: string | null | undefined;
            }[] | null | undefined;
            apply_url?: string | null | undefined;
            apply_phone?: string | null | undefined;
            apply_email?: string | null | undefined;
            published_at?: string | null | undefined;
            updated_at?: string | null | undefined;
            expires_at?: string | null | undefined;
            ideaType?: string | null | undefined;
            contact?: any;
            target_diploma_level?: string | null | undefined;
            rythmeAlternance?: any;
            elligibleHandicap?: boolean | null | undefined;
            dureeContrat?: string | null | undefined;
            quantiteContrat?: number | null | undefined;
            recipient_id?: string | null | undefined;
            url?: string | null | undefined;
            applicationCount?: number | null | undefined;
            token?: string | null | undefined;
        }, {
            id: string;
            title: string;
            description?: string | null | undefined;
            type?: string[] | null | undefined;
            status?: string | null | undefined;
            company?: {
                description?: string | null | undefined;
                name?: string | null | undefined;
                siret?: string | null | undefined;
                size?: string | null | undefined;
            } | undefined;
            place?: {
                city?: string | null | undefined;
                postalCode?: string | null | undefined;
                zipCode?: string | null | undefined;
                department?: string | null | undefined;
                region?: string | null | undefined;
                inseeCode?: string | null | undefined;
                latitude?: number | null | undefined;
                longitude?: number | null | undefined;
                distance?: number | null | undefined;
                fullAddress?: string | null | undefined;
                address?: string | null | undefined;
            } | undefined;
            contract?: {
                type?: string | null | undefined;
                duration?: number | null | undefined;
                workMode?: string | null | undefined;
            } | undefined;
            job?: {
                id?: string | null | undefined;
                description?: string | null | undefined;
                contractType?: string | null | undefined;
                creationDate?: string | null | undefined;
                jobStartDate?: string | null | undefined;
                jobExpirationDate?: string | null | undefined;
                romeDetails?: any;
            } | undefined;
            salary?: {
                description?: string | null | undefined;
                min?: number | null | undefined;
                max?: number | null | undefined;
                period?: string | null | undefined;
            } | undefined;
            rome_codes?: string[] | null | undefined;
            naf_code?: string | null | undefined;
            skills?: string[] | null | undefined;
            nafs?: any[] | null | undefined;
            degree_min?: string | null | undefined;
            experience_min?: number | null | undefined;
            languages?: {
                language: string;
                level?: string | null | undefined;
            }[] | null | undefined;
            apply_url?: string | null | undefined;
            apply_phone?: string | null | undefined;
            apply_email?: string | null | undefined;
            published_at?: string | null | undefined;
            updated_at?: string | null | undefined;
            expires_at?: string | null | undefined;
            ideaType?: string | null | undefined;
            contact?: any;
            target_diploma_level?: string | null | undefined;
            rythmeAlternance?: any;
            elligibleHandicap?: boolean | null | undefined;
            dureeContrat?: string | null | undefined;
            quantiteContrat?: number | null | undefined;
            recipient_id?: string | null | undefined;
            url?: string | null | undefined;
            applicationCount?: number | null | undefined;
            token?: string | null | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        results: {
            id: string;
            title: string;
            description?: string | null | undefined;
            type?: string[] | null | undefined;
            status?: string | null | undefined;
            company?: {
                description?: string | null | undefined;
                name?: string | null | undefined;
                siret?: string | null | undefined;
                size?: string | null | undefined;
            } | undefined;
            place?: {
                city?: string | null | undefined;
                postalCode?: string | null | undefined;
                zipCode?: string | null | undefined;
                department?: string | null | undefined;
                region?: string | null | undefined;
                inseeCode?: string | null | undefined;
                latitude?: number | null | undefined;
                longitude?: number | null | undefined;
                distance?: number | null | undefined;
                fullAddress?: string | null | undefined;
                address?: string | null | undefined;
            } | undefined;
            contract?: {
                type?: string | null | undefined;
                duration?: number | null | undefined;
                workMode?: string | null | undefined;
            } | undefined;
            job?: {
                id?: string | null | undefined;
                description?: string | null | undefined;
                contractType?: string | null | undefined;
                creationDate?: string | null | undefined;
                jobStartDate?: string | null | undefined;
                jobExpirationDate?: string | null | undefined;
                romeDetails?: any;
            } | undefined;
            salary?: {
                description?: string | null | undefined;
                min?: number | null | undefined;
                max?: number | null | undefined;
                period?: string | null | undefined;
            } | undefined;
            rome_codes?: string[] | null | undefined;
            naf_code?: string | null | undefined;
            skills?: string[] | null | undefined;
            nafs?: any[] | null | undefined;
            degree_min?: string | null | undefined;
            experience_min?: number | null | undefined;
            languages?: {
                language: string;
                level?: string | null | undefined;
            }[] | null | undefined;
            apply_url?: string | null | undefined;
            apply_phone?: string | null | undefined;
            apply_email?: string | null | undefined;
            published_at?: string | null | undefined;
            updated_at?: string | null | undefined;
            expires_at?: string | null | undefined;
            ideaType?: string | null | undefined;
            contact?: any;
            target_diploma_level?: string | null | undefined;
            rythmeAlternance?: any;
            elligibleHandicap?: boolean | null | undefined;
            dureeContrat?: string | null | undefined;
            quantiteContrat?: number | null | undefined;
            recipient_id?: string | null | undefined;
            url?: string | null | undefined;
            applicationCount?: number | null | undefined;
            token?: string | null | undefined;
        }[];
    }, {
        results: {
            id: string;
            title: string;
            description?: string | null | undefined;
            type?: string[] | null | undefined;
            status?: string | null | undefined;
            company?: {
                description?: string | null | undefined;
                name?: string | null | undefined;
                siret?: string | null | undefined;
                size?: string | null | undefined;
            } | undefined;
            place?: {
                city?: string | null | undefined;
                postalCode?: string | null | undefined;
                zipCode?: string | null | undefined;
                department?: string | null | undefined;
                region?: string | null | undefined;
                inseeCode?: string | null | undefined;
                latitude?: number | null | undefined;
                longitude?: number | null | undefined;
                distance?: number | null | undefined;
                fullAddress?: string | null | undefined;
                address?: string | null | undefined;
            } | undefined;
            contract?: {
                type?: string | null | undefined;
                duration?: number | null | undefined;
                workMode?: string | null | undefined;
            } | undefined;
            job?: {
                id?: string | null | undefined;
                description?: string | null | undefined;
                contractType?: string | null | undefined;
                creationDate?: string | null | undefined;
                jobStartDate?: string | null | undefined;
                jobExpirationDate?: string | null | undefined;
                romeDetails?: any;
            } | undefined;
            salary?: {
                description?: string | null | undefined;
                min?: number | null | undefined;
                max?: number | null | undefined;
                period?: string | null | undefined;
            } | undefined;
            rome_codes?: string[] | null | undefined;
            naf_code?: string | null | undefined;
            skills?: string[] | null | undefined;
            nafs?: any[] | null | undefined;
            degree_min?: string | null | undefined;
            experience_min?: number | null | undefined;
            languages?: {
                language: string;
                level?: string | null | undefined;
            }[] | null | undefined;
            apply_url?: string | null | undefined;
            apply_phone?: string | null | undefined;
            apply_email?: string | null | undefined;
            published_at?: string | null | undefined;
            updated_at?: string | null | undefined;
            expires_at?: string | null | undefined;
            ideaType?: string | null | undefined;
            contact?: any;
            target_diploma_level?: string | null | undefined;
            rythmeAlternance?: any;
            elligibleHandicap?: boolean | null | undefined;
            dureeContrat?: string | null | undefined;
            quantiteContrat?: number | null | undefined;
            recipient_id?: string | null | undefined;
            url?: string | null | undefined;
            applicationCount?: number | null | undefined;
            token?: string | null | undefined;
        }[];
    }>>>;
    partnerJobs: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        results: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            title: z.ZodString;
            description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            company: z.ZodOptional<z.ZodObject<{
                name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                siret: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                size: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "strip", z.ZodTypeAny, {
                description?: string | null | undefined;
                name?: string | null | undefined;
                siret?: string | null | undefined;
                size?: string | null | undefined;
            }, {
                description?: string | null | undefined;
                name?: string | null | undefined;
                siret?: string | null | undefined;
                size?: string | null | undefined;
            }>>;
            place: z.ZodOptional<z.ZodObject<{
                city: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                postalCode: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                zipCode: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                department: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                region: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                inseeCode: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                latitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                longitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                distance: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                fullAddress: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                address: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "strip", z.ZodTypeAny, {
                city?: string | null | undefined;
                postalCode?: string | null | undefined;
                zipCode?: string | null | undefined;
                department?: string | null | undefined;
                region?: string | null | undefined;
                inseeCode?: string | null | undefined;
                latitude?: number | null | undefined;
                longitude?: number | null | undefined;
                distance?: number | null | undefined;
                fullAddress?: string | null | undefined;
                address?: string | null | undefined;
            }, {
                city?: string | null | undefined;
                postalCode?: string | null | undefined;
                zipCode?: string | null | undefined;
                department?: string | null | undefined;
                region?: string | null | undefined;
                inseeCode?: string | null | undefined;
                latitude?: number | null | undefined;
                longitude?: number | null | undefined;
                distance?: number | null | undefined;
                fullAddress?: string | null | undefined;
                address?: string | null | undefined;
            }>>;
            contract: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                duration: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                workMode: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "strip", z.ZodTypeAny, {
                type?: string | null | undefined;
                duration?: number | null | undefined;
                workMode?: string | null | undefined;
            }, {
                type?: string | null | undefined;
                duration?: number | null | undefined;
                workMode?: string | null | undefined;
            }>>;
            job: z.ZodOptional<z.ZodObject<{
                id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                contractType: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                creationDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                jobStartDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                jobExpirationDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                romeDetails: z.ZodOptional<z.ZodAny>;
            }, "strip", z.ZodTypeAny, {
                id?: string | null | undefined;
                description?: string | null | undefined;
                contractType?: string | null | undefined;
                creationDate?: string | null | undefined;
                jobStartDate?: string | null | undefined;
                jobExpirationDate?: string | null | undefined;
                romeDetails?: any;
            }, {
                id?: string | null | undefined;
                description?: string | null | undefined;
                contractType?: string | null | undefined;
                creationDate?: string | null | undefined;
                jobStartDate?: string | null | undefined;
                jobExpirationDate?: string | null | undefined;
                romeDetails?: any;
            }>>;
            salary: z.ZodOptional<z.ZodObject<{
                min: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                max: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                period: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "strip", z.ZodTypeAny, {
                description?: string | null | undefined;
                min?: number | null | undefined;
                max?: number | null | undefined;
                period?: string | null | undefined;
            }, {
                description?: string | null | undefined;
                min?: number | null | undefined;
                max?: number | null | undefined;
                period?: string | null | undefined;
            }>>;
            rome_codes: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString, "many">>>;
            naf_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            skills: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString, "many">>>;
            nafs: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodAny, "many">>>;
            degree_min: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            experience_min: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            languages: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodObject<{
                language: z.ZodString;
                level: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "strip", z.ZodTypeAny, {
                language: string;
                level?: string | null | undefined;
            }, {
                language: string;
                level?: string | null | undefined;
            }>, "many">>>;
            apply_url: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            apply_phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            apply_email: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            published_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            updated_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            expires_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ideaType: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            contact: z.ZodOptional<z.ZodAny>;
            target_diploma_level: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            rythmeAlternance: z.ZodOptional<z.ZodNullable<z.ZodAny>>;
            elligibleHandicap: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
            dureeContrat: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            quantiteContrat: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            status: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            type: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString, "many">>>;
            recipient_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            url: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            applicationCount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            token: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            title: string;
            description?: string | null | undefined;
            type?: string[] | null | undefined;
            status?: string | null | undefined;
            company?: {
                description?: string | null | undefined;
                name?: string | null | undefined;
                siret?: string | null | undefined;
                size?: string | null | undefined;
            } | undefined;
            place?: {
                city?: string | null | undefined;
                postalCode?: string | null | undefined;
                zipCode?: string | null | undefined;
                department?: string | null | undefined;
                region?: string | null | undefined;
                inseeCode?: string | null | undefined;
                latitude?: number | null | undefined;
                longitude?: number | null | undefined;
                distance?: number | null | undefined;
                fullAddress?: string | null | undefined;
                address?: string | null | undefined;
            } | undefined;
            contract?: {
                type?: string | null | undefined;
                duration?: number | null | undefined;
                workMode?: string | null | undefined;
            } | undefined;
            job?: {
                id?: string | null | undefined;
                description?: string | null | undefined;
                contractType?: string | null | undefined;
                creationDate?: string | null | undefined;
                jobStartDate?: string | null | undefined;
                jobExpirationDate?: string | null | undefined;
                romeDetails?: any;
            } | undefined;
            salary?: {
                description?: string | null | undefined;
                min?: number | null | undefined;
                max?: number | null | undefined;
                period?: string | null | undefined;
            } | undefined;
            rome_codes?: string[] | null | undefined;
            naf_code?: string | null | undefined;
            skills?: string[] | null | undefined;
            nafs?: any[] | null | undefined;
            degree_min?: string | null | undefined;
            experience_min?: number | null | undefined;
            languages?: {
                language: string;
                level?: string | null | undefined;
            }[] | null | undefined;
            apply_url?: string | null | undefined;
            apply_phone?: string | null | undefined;
            apply_email?: string | null | undefined;
            published_at?: string | null | undefined;
            updated_at?: string | null | undefined;
            expires_at?: string | null | undefined;
            ideaType?: string | null | undefined;
            contact?: any;
            target_diploma_level?: string | null | undefined;
            rythmeAlternance?: any;
            elligibleHandicap?: boolean | null | undefined;
            dureeContrat?: string | null | undefined;
            quantiteContrat?: number | null | undefined;
            recipient_id?: string | null | undefined;
            url?: string | null | undefined;
            applicationCount?: number | null | undefined;
            token?: string | null | undefined;
        }, {
            id: string;
            title: string;
            description?: string | null | undefined;
            type?: string[] | null | undefined;
            status?: string | null | undefined;
            company?: {
                description?: string | null | undefined;
                name?: string | null | undefined;
                siret?: string | null | undefined;
                size?: string | null | undefined;
            } | undefined;
            place?: {
                city?: string | null | undefined;
                postalCode?: string | null | undefined;
                zipCode?: string | null | undefined;
                department?: string | null | undefined;
                region?: string | null | undefined;
                inseeCode?: string | null | undefined;
                latitude?: number | null | undefined;
                longitude?: number | null | undefined;
                distance?: number | null | undefined;
                fullAddress?: string | null | undefined;
                address?: string | null | undefined;
            } | undefined;
            contract?: {
                type?: string | null | undefined;
                duration?: number | null | undefined;
                workMode?: string | null | undefined;
            } | undefined;
            job?: {
                id?: string | null | undefined;
                description?: string | null | undefined;
                contractType?: string | null | undefined;
                creationDate?: string | null | undefined;
                jobStartDate?: string | null | undefined;
                jobExpirationDate?: string | null | undefined;
                romeDetails?: any;
            } | undefined;
            salary?: {
                description?: string | null | undefined;
                min?: number | null | undefined;
                max?: number | null | undefined;
                period?: string | null | undefined;
            } | undefined;
            rome_codes?: string[] | null | undefined;
            naf_code?: string | null | undefined;
            skills?: string[] | null | undefined;
            nafs?: any[] | null | undefined;
            degree_min?: string | null | undefined;
            experience_min?: number | null | undefined;
            languages?: {
                language: string;
                level?: string | null | undefined;
            }[] | null | undefined;
            apply_url?: string | null | undefined;
            apply_phone?: string | null | undefined;
            apply_email?: string | null | undefined;
            published_at?: string | null | undefined;
            updated_at?: string | null | undefined;
            expires_at?: string | null | undefined;
            ideaType?: string | null | undefined;
            contact?: any;
            target_diploma_level?: string | null | undefined;
            rythmeAlternance?: any;
            elligibleHandicap?: boolean | null | undefined;
            dureeContrat?: string | null | undefined;
            quantiteContrat?: number | null | undefined;
            recipient_id?: string | null | undefined;
            url?: string | null | undefined;
            applicationCount?: number | null | undefined;
            token?: string | null | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        results: {
            id: string;
            title: string;
            description?: string | null | undefined;
            type?: string[] | null | undefined;
            status?: string | null | undefined;
            company?: {
                description?: string | null | undefined;
                name?: string | null | undefined;
                siret?: string | null | undefined;
                size?: string | null | undefined;
            } | undefined;
            place?: {
                city?: string | null | undefined;
                postalCode?: string | null | undefined;
                zipCode?: string | null | undefined;
                department?: string | null | undefined;
                region?: string | null | undefined;
                inseeCode?: string | null | undefined;
                latitude?: number | null | undefined;
                longitude?: number | null | undefined;
                distance?: number | null | undefined;
                fullAddress?: string | null | undefined;
                address?: string | null | undefined;
            } | undefined;
            contract?: {
                type?: string | null | undefined;
                duration?: number | null | undefined;
                workMode?: string | null | undefined;
            } | undefined;
            job?: {
                id?: string | null | undefined;
                description?: string | null | undefined;
                contractType?: string | null | undefined;
                creationDate?: string | null | undefined;
                jobStartDate?: string | null | undefined;
                jobExpirationDate?: string | null | undefined;
                romeDetails?: any;
            } | undefined;
            salary?: {
                description?: string | null | undefined;
                min?: number | null | undefined;
                max?: number | null | undefined;
                period?: string | null | undefined;
            } | undefined;
            rome_codes?: string[] | null | undefined;
            naf_code?: string | null | undefined;
            skills?: string[] | null | undefined;
            nafs?: any[] | null | undefined;
            degree_min?: string | null | undefined;
            experience_min?: number | null | undefined;
            languages?: {
                language: string;
                level?: string | null | undefined;
            }[] | null | undefined;
            apply_url?: string | null | undefined;
            apply_phone?: string | null | undefined;
            apply_email?: string | null | undefined;
            published_at?: string | null | undefined;
            updated_at?: string | null | undefined;
            expires_at?: string | null | undefined;
            ideaType?: string | null | undefined;
            contact?: any;
            target_diploma_level?: string | null | undefined;
            rythmeAlternance?: any;
            elligibleHandicap?: boolean | null | undefined;
            dureeContrat?: string | null | undefined;
            quantiteContrat?: number | null | undefined;
            recipient_id?: string | null | undefined;
            url?: string | null | undefined;
            applicationCount?: number | null | undefined;
            token?: string | null | undefined;
        }[];
    }, {
        results: {
            id: string;
            title: string;
            description?: string | null | undefined;
            type?: string[] | null | undefined;
            status?: string | null | undefined;
            company?: {
                description?: string | null | undefined;
                name?: string | null | undefined;
                siret?: string | null | undefined;
                size?: string | null | undefined;
            } | undefined;
            place?: {
                city?: string | null | undefined;
                postalCode?: string | null | undefined;
                zipCode?: string | null | undefined;
                department?: string | null | undefined;
                region?: string | null | undefined;
                inseeCode?: string | null | undefined;
                latitude?: number | null | undefined;
                longitude?: number | null | undefined;
                distance?: number | null | undefined;
                fullAddress?: string | null | undefined;
                address?: string | null | undefined;
            } | undefined;
            contract?: {
                type?: string | null | undefined;
                duration?: number | null | undefined;
                workMode?: string | null | undefined;
            } | undefined;
            job?: {
                id?: string | null | undefined;
                description?: string | null | undefined;
                contractType?: string | null | undefined;
                creationDate?: string | null | undefined;
                jobStartDate?: string | null | undefined;
                jobExpirationDate?: string | null | undefined;
                romeDetails?: any;
            } | undefined;
            salary?: {
                description?: string | null | undefined;
                min?: number | null | undefined;
                max?: number | null | undefined;
                period?: string | null | undefined;
            } | undefined;
            rome_codes?: string[] | null | undefined;
            naf_code?: string | null | undefined;
            skills?: string[] | null | undefined;
            nafs?: any[] | null | undefined;
            degree_min?: string | null | undefined;
            experience_min?: number | null | undefined;
            languages?: {
                language: string;
                level?: string | null | undefined;
            }[] | null | undefined;
            apply_url?: string | null | undefined;
            apply_phone?: string | null | undefined;
            apply_email?: string | null | undefined;
            published_at?: string | null | undefined;
            updated_at?: string | null | undefined;
            expires_at?: string | null | undefined;
            ideaType?: string | null | undefined;
            contact?: any;
            target_diploma_level?: string | null | undefined;
            rythmeAlternance?: any;
            elligibleHandicap?: boolean | null | undefined;
            dureeContrat?: string | null | undefined;
            quantiteContrat?: number | null | undefined;
            recipient_id?: string | null | undefined;
            url?: string | null | undefined;
            applicationCount?: number | null | undefined;
            token?: string | null | undefined;
        }[];
    }>>>;
    matchas: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        results: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            title: z.ZodString;
            description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            company: z.ZodOptional<z.ZodObject<{
                name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                siret: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                size: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "strip", z.ZodTypeAny, {
                description?: string | null | undefined;
                name?: string | null | undefined;
                siret?: string | null | undefined;
                size?: string | null | undefined;
            }, {
                description?: string | null | undefined;
                name?: string | null | undefined;
                siret?: string | null | undefined;
                size?: string | null | undefined;
            }>>;
            place: z.ZodOptional<z.ZodObject<{
                city: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                postalCode: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                zipCode: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                department: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                region: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                inseeCode: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                latitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                longitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                distance: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                fullAddress: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                address: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "strip", z.ZodTypeAny, {
                city?: string | null | undefined;
                postalCode?: string | null | undefined;
                zipCode?: string | null | undefined;
                department?: string | null | undefined;
                region?: string | null | undefined;
                inseeCode?: string | null | undefined;
                latitude?: number | null | undefined;
                longitude?: number | null | undefined;
                distance?: number | null | undefined;
                fullAddress?: string | null | undefined;
                address?: string | null | undefined;
            }, {
                city?: string | null | undefined;
                postalCode?: string | null | undefined;
                zipCode?: string | null | undefined;
                department?: string | null | undefined;
                region?: string | null | undefined;
                inseeCode?: string | null | undefined;
                latitude?: number | null | undefined;
                longitude?: number | null | undefined;
                distance?: number | null | undefined;
                fullAddress?: string | null | undefined;
                address?: string | null | undefined;
            }>>;
            contract: z.ZodOptional<z.ZodObject<{
                type: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                duration: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                workMode: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "strip", z.ZodTypeAny, {
                type?: string | null | undefined;
                duration?: number | null | undefined;
                workMode?: string | null | undefined;
            }, {
                type?: string | null | undefined;
                duration?: number | null | undefined;
                workMode?: string | null | undefined;
            }>>;
            job: z.ZodOptional<z.ZodObject<{
                id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                contractType: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                creationDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                jobStartDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                jobExpirationDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                romeDetails: z.ZodOptional<z.ZodAny>;
            }, "strip", z.ZodTypeAny, {
                id?: string | null | undefined;
                description?: string | null | undefined;
                contractType?: string | null | undefined;
                creationDate?: string | null | undefined;
                jobStartDate?: string | null | undefined;
                jobExpirationDate?: string | null | undefined;
                romeDetails?: any;
            }, {
                id?: string | null | undefined;
                description?: string | null | undefined;
                contractType?: string | null | undefined;
                creationDate?: string | null | undefined;
                jobStartDate?: string | null | undefined;
                jobExpirationDate?: string | null | undefined;
                romeDetails?: any;
            }>>;
            salary: z.ZodOptional<z.ZodObject<{
                min: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                max: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                period: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "strip", z.ZodTypeAny, {
                description?: string | null | undefined;
                min?: number | null | undefined;
                max?: number | null | undefined;
                period?: string | null | undefined;
            }, {
                description?: string | null | undefined;
                min?: number | null | undefined;
                max?: number | null | undefined;
                period?: string | null | undefined;
            }>>;
            rome_codes: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString, "many">>>;
            naf_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            skills: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString, "many">>>;
            nafs: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodAny, "many">>>;
            degree_min: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            experience_min: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            languages: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodObject<{
                language: z.ZodString;
                level: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "strip", z.ZodTypeAny, {
                language: string;
                level?: string | null | undefined;
            }, {
                language: string;
                level?: string | null | undefined;
            }>, "many">>>;
            apply_url: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            apply_phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            apply_email: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            published_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            updated_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            expires_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ideaType: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            contact: z.ZodOptional<z.ZodAny>;
            target_diploma_level: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            rythmeAlternance: z.ZodOptional<z.ZodNullable<z.ZodAny>>;
            elligibleHandicap: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
            dureeContrat: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            quantiteContrat: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            status: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            type: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString, "many">>>;
            recipient_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            url: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            applicationCount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            token: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            title: string;
            description?: string | null | undefined;
            type?: string[] | null | undefined;
            status?: string | null | undefined;
            company?: {
                description?: string | null | undefined;
                name?: string | null | undefined;
                siret?: string | null | undefined;
                size?: string | null | undefined;
            } | undefined;
            place?: {
                city?: string | null | undefined;
                postalCode?: string | null | undefined;
                zipCode?: string | null | undefined;
                department?: string | null | undefined;
                region?: string | null | undefined;
                inseeCode?: string | null | undefined;
                latitude?: number | null | undefined;
                longitude?: number | null | undefined;
                distance?: number | null | undefined;
                fullAddress?: string | null | undefined;
                address?: string | null | undefined;
            } | undefined;
            contract?: {
                type?: string | null | undefined;
                duration?: number | null | undefined;
                workMode?: string | null | undefined;
            } | undefined;
            job?: {
                id?: string | null | undefined;
                description?: string | null | undefined;
                contractType?: string | null | undefined;
                creationDate?: string | null | undefined;
                jobStartDate?: string | null | undefined;
                jobExpirationDate?: string | null | undefined;
                romeDetails?: any;
            } | undefined;
            salary?: {
                description?: string | null | undefined;
                min?: number | null | undefined;
                max?: number | null | undefined;
                period?: string | null | undefined;
            } | undefined;
            rome_codes?: string[] | null | undefined;
            naf_code?: string | null | undefined;
            skills?: string[] | null | undefined;
            nafs?: any[] | null | undefined;
            degree_min?: string | null | undefined;
            experience_min?: number | null | undefined;
            languages?: {
                language: string;
                level?: string | null | undefined;
            }[] | null | undefined;
            apply_url?: string | null | undefined;
            apply_phone?: string | null | undefined;
            apply_email?: string | null | undefined;
            published_at?: string | null | undefined;
            updated_at?: string | null | undefined;
            expires_at?: string | null | undefined;
            ideaType?: string | null | undefined;
            contact?: any;
            target_diploma_level?: string | null | undefined;
            rythmeAlternance?: any;
            elligibleHandicap?: boolean | null | undefined;
            dureeContrat?: string | null | undefined;
            quantiteContrat?: number | null | undefined;
            recipient_id?: string | null | undefined;
            url?: string | null | undefined;
            applicationCount?: number | null | undefined;
            token?: string | null | undefined;
        }, {
            id: string;
            title: string;
            description?: string | null | undefined;
            type?: string[] | null | undefined;
            status?: string | null | undefined;
            company?: {
                description?: string | null | undefined;
                name?: string | null | undefined;
                siret?: string | null | undefined;
                size?: string | null | undefined;
            } | undefined;
            place?: {
                city?: string | null | undefined;
                postalCode?: string | null | undefined;
                zipCode?: string | null | undefined;
                department?: string | null | undefined;
                region?: string | null | undefined;
                inseeCode?: string | null | undefined;
                latitude?: number | null | undefined;
                longitude?: number | null | undefined;
                distance?: number | null | undefined;
                fullAddress?: string | null | undefined;
                address?: string | null | undefined;
            } | undefined;
            contract?: {
                type?: string | null | undefined;
                duration?: number | null | undefined;
                workMode?: string | null | undefined;
            } | undefined;
            job?: {
                id?: string | null | undefined;
                description?: string | null | undefined;
                contractType?: string | null | undefined;
                creationDate?: string | null | undefined;
                jobStartDate?: string | null | undefined;
                jobExpirationDate?: string | null | undefined;
                romeDetails?: any;
            } | undefined;
            salary?: {
                description?: string | null | undefined;
                min?: number | null | undefined;
                max?: number | null | undefined;
                period?: string | null | undefined;
            } | undefined;
            rome_codes?: string[] | null | undefined;
            naf_code?: string | null | undefined;
            skills?: string[] | null | undefined;
            nafs?: any[] | null | undefined;
            degree_min?: string | null | undefined;
            experience_min?: number | null | undefined;
            languages?: {
                language: string;
                level?: string | null | undefined;
            }[] | null | undefined;
            apply_url?: string | null | undefined;
            apply_phone?: string | null | undefined;
            apply_email?: string | null | undefined;
            published_at?: string | null | undefined;
            updated_at?: string | null | undefined;
            expires_at?: string | null | undefined;
            ideaType?: string | null | undefined;
            contact?: any;
            target_diploma_level?: string | null | undefined;
            rythmeAlternance?: any;
            elligibleHandicap?: boolean | null | undefined;
            dureeContrat?: string | null | undefined;
            quantiteContrat?: number | null | undefined;
            recipient_id?: string | null | undefined;
            url?: string | null | undefined;
            applicationCount?: number | null | undefined;
            token?: string | null | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        results: {
            id: string;
            title: string;
            description?: string | null | undefined;
            type?: string[] | null | undefined;
            status?: string | null | undefined;
            company?: {
                description?: string | null | undefined;
                name?: string | null | undefined;
                siret?: string | null | undefined;
                size?: string | null | undefined;
            } | undefined;
            place?: {
                city?: string | null | undefined;
                postalCode?: string | null | undefined;
                zipCode?: string | null | undefined;
                department?: string | null | undefined;
                region?: string | null | undefined;
                inseeCode?: string | null | undefined;
                latitude?: number | null | undefined;
                longitude?: number | null | undefined;
                distance?: number | null | undefined;
                fullAddress?: string | null | undefined;
                address?: string | null | undefined;
            } | undefined;
            contract?: {
                type?: string | null | undefined;
                duration?: number | null | undefined;
                workMode?: string | null | undefined;
            } | undefined;
            job?: {
                id?: string | null | undefined;
                description?: string | null | undefined;
                contractType?: string | null | undefined;
                creationDate?: string | null | undefined;
                jobStartDate?: string | null | undefined;
                jobExpirationDate?: string | null | undefined;
                romeDetails?: any;
            } | undefined;
            salary?: {
                description?: string | null | undefined;
                min?: number | null | undefined;
                max?: number | null | undefined;
                period?: string | null | undefined;
            } | undefined;
            rome_codes?: string[] | null | undefined;
            naf_code?: string | null | undefined;
            skills?: string[] | null | undefined;
            nafs?: any[] | null | undefined;
            degree_min?: string | null | undefined;
            experience_min?: number | null | undefined;
            languages?: {
                language: string;
                level?: string | null | undefined;
            }[] | null | undefined;
            apply_url?: string | null | undefined;
            apply_phone?: string | null | undefined;
            apply_email?: string | null | undefined;
            published_at?: string | null | undefined;
            updated_at?: string | null | undefined;
            expires_at?: string | null | undefined;
            ideaType?: string | null | undefined;
            contact?: any;
            target_diploma_level?: string | null | undefined;
            rythmeAlternance?: any;
            elligibleHandicap?: boolean | null | undefined;
            dureeContrat?: string | null | undefined;
            quantiteContrat?: number | null | undefined;
            recipient_id?: string | null | undefined;
            url?: string | null | undefined;
            applicationCount?: number | null | undefined;
            token?: string | null | undefined;
        }[];
    }, {
        results: {
            id: string;
            title: string;
            description?: string | null | undefined;
            type?: string[] | null | undefined;
            status?: string | null | undefined;
            company?: {
                description?: string | null | undefined;
                name?: string | null | undefined;
                siret?: string | null | undefined;
                size?: string | null | undefined;
            } | undefined;
            place?: {
                city?: string | null | undefined;
                postalCode?: string | null | undefined;
                zipCode?: string | null | undefined;
                department?: string | null | undefined;
                region?: string | null | undefined;
                inseeCode?: string | null | undefined;
                latitude?: number | null | undefined;
                longitude?: number | null | undefined;
                distance?: number | null | undefined;
                fullAddress?: string | null | undefined;
                address?: string | null | undefined;
            } | undefined;
            contract?: {
                type?: string | null | undefined;
                duration?: number | null | undefined;
                workMode?: string | null | undefined;
            } | undefined;
            job?: {
                id?: string | null | undefined;
                description?: string | null | undefined;
                contractType?: string | null | undefined;
                creationDate?: string | null | undefined;
                jobStartDate?: string | null | undefined;
                jobExpirationDate?: string | null | undefined;
                romeDetails?: any;
            } | undefined;
            salary?: {
                description?: string | null | undefined;
                min?: number | null | undefined;
                max?: number | null | undefined;
                period?: string | null | undefined;
            } | undefined;
            rome_codes?: string[] | null | undefined;
            naf_code?: string | null | undefined;
            skills?: string[] | null | undefined;
            nafs?: any[] | null | undefined;
            degree_min?: string | null | undefined;
            experience_min?: number | null | undefined;
            languages?: {
                language: string;
                level?: string | null | undefined;
            }[] | null | undefined;
            apply_url?: string | null | undefined;
            apply_phone?: string | null | undefined;
            apply_email?: string | null | undefined;
            published_at?: string | null | undefined;
            updated_at?: string | null | undefined;
            expires_at?: string | null | undefined;
            ideaType?: string | null | undefined;
            contact?: any;
            target_diploma_level?: string | null | undefined;
            rythmeAlternance?: any;
            elligibleHandicap?: boolean | null | undefined;
            dureeContrat?: string | null | undefined;
            quantiteContrat?: number | null | undefined;
            recipient_id?: string | null | undefined;
            url?: string | null | undefined;
            applicationCount?: number | null | undefined;
            token?: string | null | undefined;
        }[];
    }>>>;
    lbaCompanies: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        results: z.ZodArray<z.ZodAny, "many">;
    }, "strip", z.ZodTypeAny, {
        results: any[];
    }, {
        results: any[];
    }>>>;
    lbbCompanies: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        results: z.ZodArray<z.ZodAny, "many">;
    }, "strip", z.ZodTypeAny, {
        results: any[];
    }, {
        results: any[];
    }>>>;
}, "strip", z.ZodTypeAny, {
    peJobs?: {
        results: {
            id: string;
            title: string;
            description?: string | null | undefined;
            type?: string[] | null | undefined;
            status?: string | null | undefined;
            company?: {
                description?: string | null | undefined;
                name?: string | null | undefined;
                siret?: string | null | undefined;
                size?: string | null | undefined;
            } | undefined;
            place?: {
                city?: string | null | undefined;
                postalCode?: string | null | undefined;
                zipCode?: string | null | undefined;
                department?: string | null | undefined;
                region?: string | null | undefined;
                inseeCode?: string | null | undefined;
                latitude?: number | null | undefined;
                longitude?: number | null | undefined;
                distance?: number | null | undefined;
                fullAddress?: string | null | undefined;
                address?: string | null | undefined;
            } | undefined;
            contract?: {
                type?: string | null | undefined;
                duration?: number | null | undefined;
                workMode?: string | null | undefined;
            } | undefined;
            job?: {
                id?: string | null | undefined;
                description?: string | null | undefined;
                contractType?: string | null | undefined;
                creationDate?: string | null | undefined;
                jobStartDate?: string | null | undefined;
                jobExpirationDate?: string | null | undefined;
                romeDetails?: any;
            } | undefined;
            salary?: {
                description?: string | null | undefined;
                min?: number | null | undefined;
                max?: number | null | undefined;
                period?: string | null | undefined;
            } | undefined;
            rome_codes?: string[] | null | undefined;
            naf_code?: string | null | undefined;
            skills?: string[] | null | undefined;
            nafs?: any[] | null | undefined;
            degree_min?: string | null | undefined;
            experience_min?: number | null | undefined;
            languages?: {
                language: string;
                level?: string | null | undefined;
            }[] | null | undefined;
            apply_url?: string | null | undefined;
            apply_phone?: string | null | undefined;
            apply_email?: string | null | undefined;
            published_at?: string | null | undefined;
            updated_at?: string | null | undefined;
            expires_at?: string | null | undefined;
            ideaType?: string | null | undefined;
            contact?: any;
            target_diploma_level?: string | null | undefined;
            rythmeAlternance?: any;
            elligibleHandicap?: boolean | null | undefined;
            dureeContrat?: string | null | undefined;
            quantiteContrat?: number | null | undefined;
            recipient_id?: string | null | undefined;
            url?: string | null | undefined;
            applicationCount?: number | null | undefined;
            token?: string | null | undefined;
        }[];
    } | null | undefined;
    partnerJobs?: {
        results: {
            id: string;
            title: string;
            description?: string | null | undefined;
            type?: string[] | null | undefined;
            status?: string | null | undefined;
            company?: {
                description?: string | null | undefined;
                name?: string | null | undefined;
                siret?: string | null | undefined;
                size?: string | null | undefined;
            } | undefined;
            place?: {
                city?: string | null | undefined;
                postalCode?: string | null | undefined;
                zipCode?: string | null | undefined;
                department?: string | null | undefined;
                region?: string | null | undefined;
                inseeCode?: string | null | undefined;
                latitude?: number | null | undefined;
                longitude?: number | null | undefined;
                distance?: number | null | undefined;
                fullAddress?: string | null | undefined;
                address?: string | null | undefined;
            } | undefined;
            contract?: {
                type?: string | null | undefined;
                duration?: number | null | undefined;
                workMode?: string | null | undefined;
            } | undefined;
            job?: {
                id?: string | null | undefined;
                description?: string | null | undefined;
                contractType?: string | null | undefined;
                creationDate?: string | null | undefined;
                jobStartDate?: string | null | undefined;
                jobExpirationDate?: string | null | undefined;
                romeDetails?: any;
            } | undefined;
            salary?: {
                description?: string | null | undefined;
                min?: number | null | undefined;
                max?: number | null | undefined;
                period?: string | null | undefined;
            } | undefined;
            rome_codes?: string[] | null | undefined;
            naf_code?: string | null | undefined;
            skills?: string[] | null | undefined;
            nafs?: any[] | null | undefined;
            degree_min?: string | null | undefined;
            experience_min?: number | null | undefined;
            languages?: {
                language: string;
                level?: string | null | undefined;
            }[] | null | undefined;
            apply_url?: string | null | undefined;
            apply_phone?: string | null | undefined;
            apply_email?: string | null | undefined;
            published_at?: string | null | undefined;
            updated_at?: string | null | undefined;
            expires_at?: string | null | undefined;
            ideaType?: string | null | undefined;
            contact?: any;
            target_diploma_level?: string | null | undefined;
            rythmeAlternance?: any;
            elligibleHandicap?: boolean | null | undefined;
            dureeContrat?: string | null | undefined;
            quantiteContrat?: number | null | undefined;
            recipient_id?: string | null | undefined;
            url?: string | null | undefined;
            applicationCount?: number | null | undefined;
            token?: string | null | undefined;
        }[];
    } | null | undefined;
    matchas?: {
        results: {
            id: string;
            title: string;
            description?: string | null | undefined;
            type?: string[] | null | undefined;
            status?: string | null | undefined;
            company?: {
                description?: string | null | undefined;
                name?: string | null | undefined;
                siret?: string | null | undefined;
                size?: string | null | undefined;
            } | undefined;
            place?: {
                city?: string | null | undefined;
                postalCode?: string | null | undefined;
                zipCode?: string | null | undefined;
                department?: string | null | undefined;
                region?: string | null | undefined;
                inseeCode?: string | null | undefined;
                latitude?: number | null | undefined;
                longitude?: number | null | undefined;
                distance?: number | null | undefined;
                fullAddress?: string | null | undefined;
                address?: string | null | undefined;
            } | undefined;
            contract?: {
                type?: string | null | undefined;
                duration?: number | null | undefined;
                workMode?: string | null | undefined;
            } | undefined;
            job?: {
                id?: string | null | undefined;
                description?: string | null | undefined;
                contractType?: string | null | undefined;
                creationDate?: string | null | undefined;
                jobStartDate?: string | null | undefined;
                jobExpirationDate?: string | null | undefined;
                romeDetails?: any;
            } | undefined;
            salary?: {
                description?: string | null | undefined;
                min?: number | null | undefined;
                max?: number | null | undefined;
                period?: string | null | undefined;
            } | undefined;
            rome_codes?: string[] | null | undefined;
            naf_code?: string | null | undefined;
            skills?: string[] | null | undefined;
            nafs?: any[] | null | undefined;
            degree_min?: string | null | undefined;
            experience_min?: number | null | undefined;
            languages?: {
                language: string;
                level?: string | null | undefined;
            }[] | null | undefined;
            apply_url?: string | null | undefined;
            apply_phone?: string | null | undefined;
            apply_email?: string | null | undefined;
            published_at?: string | null | undefined;
            updated_at?: string | null | undefined;
            expires_at?: string | null | undefined;
            ideaType?: string | null | undefined;
            contact?: any;
            target_diploma_level?: string | null | undefined;
            rythmeAlternance?: any;
            elligibleHandicap?: boolean | null | undefined;
            dureeContrat?: string | null | undefined;
            quantiteContrat?: number | null | undefined;
            recipient_id?: string | null | undefined;
            url?: string | null | undefined;
            applicationCount?: number | null | undefined;
            token?: string | null | undefined;
        }[];
    } | null | undefined;
    lbaCompanies?: {
        results: any[];
    } | null | undefined;
    lbbCompanies?: {
        results: any[];
    } | null | undefined;
}, {
    peJobs?: {
        results: {
            id: string;
            title: string;
            description?: string | null | undefined;
            type?: string[] | null | undefined;
            status?: string | null | undefined;
            company?: {
                description?: string | null | undefined;
                name?: string | null | undefined;
                siret?: string | null | undefined;
                size?: string | null | undefined;
            } | undefined;
            place?: {
                city?: string | null | undefined;
                postalCode?: string | null | undefined;
                zipCode?: string | null | undefined;
                department?: string | null | undefined;
                region?: string | null | undefined;
                inseeCode?: string | null | undefined;
                latitude?: number | null | undefined;
                longitude?: number | null | undefined;
                distance?: number | null | undefined;
                fullAddress?: string | null | undefined;
                address?: string | null | undefined;
            } | undefined;
            contract?: {
                type?: string | null | undefined;
                duration?: number | null | undefined;
                workMode?: string | null | undefined;
            } | undefined;
            job?: {
                id?: string | null | undefined;
                description?: string | null | undefined;
                contractType?: string | null | undefined;
                creationDate?: string | null | undefined;
                jobStartDate?: string | null | undefined;
                jobExpirationDate?: string | null | undefined;
                romeDetails?: any;
            } | undefined;
            salary?: {
                description?: string | null | undefined;
                min?: number | null | undefined;
                max?: number | null | undefined;
                period?: string | null | undefined;
            } | undefined;
            rome_codes?: string[] | null | undefined;
            naf_code?: string | null | undefined;
            skills?: string[] | null | undefined;
            nafs?: any[] | null | undefined;
            degree_min?: string | null | undefined;
            experience_min?: number | null | undefined;
            languages?: {
                language: string;
                level?: string | null | undefined;
            }[] | null | undefined;
            apply_url?: string | null | undefined;
            apply_phone?: string | null | undefined;
            apply_email?: string | null | undefined;
            published_at?: string | null | undefined;
            updated_at?: string | null | undefined;
            expires_at?: string | null | undefined;
            ideaType?: string | null | undefined;
            contact?: any;
            target_diploma_level?: string | null | undefined;
            rythmeAlternance?: any;
            elligibleHandicap?: boolean | null | undefined;
            dureeContrat?: string | null | undefined;
            quantiteContrat?: number | null | undefined;
            recipient_id?: string | null | undefined;
            url?: string | null | undefined;
            applicationCount?: number | null | undefined;
            token?: string | null | undefined;
        }[];
    } | null | undefined;
    partnerJobs?: {
        results: {
            id: string;
            title: string;
            description?: string | null | undefined;
            type?: string[] | null | undefined;
            status?: string | null | undefined;
            company?: {
                description?: string | null | undefined;
                name?: string | null | undefined;
                siret?: string | null | undefined;
                size?: string | null | undefined;
            } | undefined;
            place?: {
                city?: string | null | undefined;
                postalCode?: string | null | undefined;
                zipCode?: string | null | undefined;
                department?: string | null | undefined;
                region?: string | null | undefined;
                inseeCode?: string | null | undefined;
                latitude?: number | null | undefined;
                longitude?: number | null | undefined;
                distance?: number | null | undefined;
                fullAddress?: string | null | undefined;
                address?: string | null | undefined;
            } | undefined;
            contract?: {
                type?: string | null | undefined;
                duration?: number | null | undefined;
                workMode?: string | null | undefined;
            } | undefined;
            job?: {
                id?: string | null | undefined;
                description?: string | null | undefined;
                contractType?: string | null | undefined;
                creationDate?: string | null | undefined;
                jobStartDate?: string | null | undefined;
                jobExpirationDate?: string | null | undefined;
                romeDetails?: any;
            } | undefined;
            salary?: {
                description?: string | null | undefined;
                min?: number | null | undefined;
                max?: number | null | undefined;
                period?: string | null | undefined;
            } | undefined;
            rome_codes?: string[] | null | undefined;
            naf_code?: string | null | undefined;
            skills?: string[] | null | undefined;
            nafs?: any[] | null | undefined;
            degree_min?: string | null | undefined;
            experience_min?: number | null | undefined;
            languages?: {
                language: string;
                level?: string | null | undefined;
            }[] | null | undefined;
            apply_url?: string | null | undefined;
            apply_phone?: string | null | undefined;
            apply_email?: string | null | undefined;
            published_at?: string | null | undefined;
            updated_at?: string | null | undefined;
            expires_at?: string | null | undefined;
            ideaType?: string | null | undefined;
            contact?: any;
            target_diploma_level?: string | null | undefined;
            rythmeAlternance?: any;
            elligibleHandicap?: boolean | null | undefined;
            dureeContrat?: string | null | undefined;
            quantiteContrat?: number | null | undefined;
            recipient_id?: string | null | undefined;
            url?: string | null | undefined;
            applicationCount?: number | null | undefined;
            token?: string | null | undefined;
        }[];
    } | null | undefined;
    matchas?: {
        results: {
            id: string;
            title: string;
            description?: string | null | undefined;
            type?: string[] | null | undefined;
            status?: string | null | undefined;
            company?: {
                description?: string | null | undefined;
                name?: string | null | undefined;
                siret?: string | null | undefined;
                size?: string | null | undefined;
            } | undefined;
            place?: {
                city?: string | null | undefined;
                postalCode?: string | null | undefined;
                zipCode?: string | null | undefined;
                department?: string | null | undefined;
                region?: string | null | undefined;
                inseeCode?: string | null | undefined;
                latitude?: number | null | undefined;
                longitude?: number | null | undefined;
                distance?: number | null | undefined;
                fullAddress?: string | null | undefined;
                address?: string | null | undefined;
            } | undefined;
            contract?: {
                type?: string | null | undefined;
                duration?: number | null | undefined;
                workMode?: string | null | undefined;
            } | undefined;
            job?: {
                id?: string | null | undefined;
                description?: string | null | undefined;
                contractType?: string | null | undefined;
                creationDate?: string | null | undefined;
                jobStartDate?: string | null | undefined;
                jobExpirationDate?: string | null | undefined;
                romeDetails?: any;
            } | undefined;
            salary?: {
                description?: string | null | undefined;
                min?: number | null | undefined;
                max?: number | null | undefined;
                period?: string | null | undefined;
            } | undefined;
            rome_codes?: string[] | null | undefined;
            naf_code?: string | null | undefined;
            skills?: string[] | null | undefined;
            nafs?: any[] | null | undefined;
            degree_min?: string | null | undefined;
            experience_min?: number | null | undefined;
            languages?: {
                language: string;
                level?: string | null | undefined;
            }[] | null | undefined;
            apply_url?: string | null | undefined;
            apply_phone?: string | null | undefined;
            apply_email?: string | null | undefined;
            published_at?: string | null | undefined;
            updated_at?: string | null | undefined;
            expires_at?: string | null | undefined;
            ideaType?: string | null | undefined;
            contact?: any;
            target_diploma_level?: string | null | undefined;
            rythmeAlternance?: any;
            elligibleHandicap?: boolean | null | undefined;
            dureeContrat?: string | null | undefined;
            quantiteContrat?: number | null | undefined;
            recipient_id?: string | null | undefined;
            url?: string | null | undefined;
            applicationCount?: number | null | undefined;
            token?: string | null | undefined;
        }[];
    } | null | undefined;
    lbaCompanies?: {
        results: any[];
    } | null | undefined;
    lbbCompanies?: {
        results: any[];
    } | null | undefined;
}>;
type LBAResponse = z.infer<typeof LBAResponseSchema>;
interface LBAClientConfig {
    apiKey: string;
    baseUrl?: string;
    maxRetries?: number;
    retryDelay?: number;
}
interface LBASearchParams {
    from?: string;
    to?: string;
    page?: number;
    per_page?: number;
    rome?: string[];
    romeCodes?: string[];
    department?: string[];
    departments?: string[];
    city?: string[];
    contract_type?: string[];
    company_size?: string[];
}
declare class LBAClient {
    private apiKey;
    private baseUrl;
    private maxRetries;
    private retryDelay;
    constructor(config: LBAClientConfig);
    private fetchWithRetry;
    searchOffers(params?: LBASearchParams): Promise<{
        peJobs?: {
            results: {
                id: string;
                title: string;
                description?: string | null | undefined;
                type?: string[] | null | undefined;
                status?: string | null | undefined;
                company?: {
                    description?: string | null | undefined;
                    name?: string | null | undefined;
                    siret?: string | null | undefined;
                    size?: string | null | undefined;
                } | undefined;
                place?: {
                    city?: string | null | undefined;
                    postalCode?: string | null | undefined;
                    zipCode?: string | null | undefined;
                    department?: string | null | undefined;
                    region?: string | null | undefined;
                    inseeCode?: string | null | undefined;
                    latitude?: number | null | undefined;
                    longitude?: number | null | undefined;
                    distance?: number | null | undefined;
                    fullAddress?: string | null | undefined;
                    address?: string | null | undefined;
                } | undefined;
                contract?: {
                    type?: string | null | undefined;
                    duration?: number | null | undefined;
                    workMode?: string | null | undefined;
                } | undefined;
                job?: {
                    id?: string | null | undefined;
                    description?: string | null | undefined;
                    contractType?: string | null | undefined;
                    creationDate?: string | null | undefined;
                    jobStartDate?: string | null | undefined;
                    jobExpirationDate?: string | null | undefined;
                    romeDetails?: any;
                } | undefined;
                salary?: {
                    description?: string | null | undefined;
                    min?: number | null | undefined;
                    max?: number | null | undefined;
                    period?: string | null | undefined;
                } | undefined;
                rome_codes?: string[] | null | undefined;
                naf_code?: string | null | undefined;
                skills?: string[] | null | undefined;
                nafs?: any[] | null | undefined;
                degree_min?: string | null | undefined;
                experience_min?: number | null | undefined;
                languages?: {
                    language: string;
                    level?: string | null | undefined;
                }[] | null | undefined;
                apply_url?: string | null | undefined;
                apply_phone?: string | null | undefined;
                apply_email?: string | null | undefined;
                published_at?: string | null | undefined;
                updated_at?: string | null | undefined;
                expires_at?: string | null | undefined;
                ideaType?: string | null | undefined;
                contact?: any;
                target_diploma_level?: string | null | undefined;
                rythmeAlternance?: any;
                elligibleHandicap?: boolean | null | undefined;
                dureeContrat?: string | null | undefined;
                quantiteContrat?: number | null | undefined;
                recipient_id?: string | null | undefined;
                url?: string | null | undefined;
                applicationCount?: number | null | undefined;
                token?: string | null | undefined;
            }[];
        } | null | undefined;
        partnerJobs?: {
            results: {
                id: string;
                title: string;
                description?: string | null | undefined;
                type?: string[] | null | undefined;
                status?: string | null | undefined;
                company?: {
                    description?: string | null | undefined;
                    name?: string | null | undefined;
                    siret?: string | null | undefined;
                    size?: string | null | undefined;
                } | undefined;
                place?: {
                    city?: string | null | undefined;
                    postalCode?: string | null | undefined;
                    zipCode?: string | null | undefined;
                    department?: string | null | undefined;
                    region?: string | null | undefined;
                    inseeCode?: string | null | undefined;
                    latitude?: number | null | undefined;
                    longitude?: number | null | undefined;
                    distance?: number | null | undefined;
                    fullAddress?: string | null | undefined;
                    address?: string | null | undefined;
                } | undefined;
                contract?: {
                    type?: string | null | undefined;
                    duration?: number | null | undefined;
                    workMode?: string | null | undefined;
                } | undefined;
                job?: {
                    id?: string | null | undefined;
                    description?: string | null | undefined;
                    contractType?: string | null | undefined;
                    creationDate?: string | null | undefined;
                    jobStartDate?: string | null | undefined;
                    jobExpirationDate?: string | null | undefined;
                    romeDetails?: any;
                } | undefined;
                salary?: {
                    description?: string | null | undefined;
                    min?: number | null | undefined;
                    max?: number | null | undefined;
                    period?: string | null | undefined;
                } | undefined;
                rome_codes?: string[] | null | undefined;
                naf_code?: string | null | undefined;
                skills?: string[] | null | undefined;
                nafs?: any[] | null | undefined;
                degree_min?: string | null | undefined;
                experience_min?: number | null | undefined;
                languages?: {
                    language: string;
                    level?: string | null | undefined;
                }[] | null | undefined;
                apply_url?: string | null | undefined;
                apply_phone?: string | null | undefined;
                apply_email?: string | null | undefined;
                published_at?: string | null | undefined;
                updated_at?: string | null | undefined;
                expires_at?: string | null | undefined;
                ideaType?: string | null | undefined;
                contact?: any;
                target_diploma_level?: string | null | undefined;
                rythmeAlternance?: any;
                elligibleHandicap?: boolean | null | undefined;
                dureeContrat?: string | null | undefined;
                quantiteContrat?: number | null | undefined;
                recipient_id?: string | null | undefined;
                url?: string | null | undefined;
                applicationCount?: number | null | undefined;
                token?: string | null | undefined;
            }[];
        } | null | undefined;
        matchas?: {
            results: {
                id: string;
                title: string;
                description?: string | null | undefined;
                type?: string[] | null | undefined;
                status?: string | null | undefined;
                company?: {
                    description?: string | null | undefined;
                    name?: string | null | undefined;
                    siret?: string | null | undefined;
                    size?: string | null | undefined;
                } | undefined;
                place?: {
                    city?: string | null | undefined;
                    postalCode?: string | null | undefined;
                    zipCode?: string | null | undefined;
                    department?: string | null | undefined;
                    region?: string | null | undefined;
                    inseeCode?: string | null | undefined;
                    latitude?: number | null | undefined;
                    longitude?: number | null | undefined;
                    distance?: number | null | undefined;
                    fullAddress?: string | null | undefined;
                    address?: string | null | undefined;
                } | undefined;
                contract?: {
                    type?: string | null | undefined;
                    duration?: number | null | undefined;
                    workMode?: string | null | undefined;
                } | undefined;
                job?: {
                    id?: string | null | undefined;
                    description?: string | null | undefined;
                    contractType?: string | null | undefined;
                    creationDate?: string | null | undefined;
                    jobStartDate?: string | null | undefined;
                    jobExpirationDate?: string | null | undefined;
                    romeDetails?: any;
                } | undefined;
                salary?: {
                    description?: string | null | undefined;
                    min?: number | null | undefined;
                    max?: number | null | undefined;
                    period?: string | null | undefined;
                } | undefined;
                rome_codes?: string[] | null | undefined;
                naf_code?: string | null | undefined;
                skills?: string[] | null | undefined;
                nafs?: any[] | null | undefined;
                degree_min?: string | null | undefined;
                experience_min?: number | null | undefined;
                languages?: {
                    language: string;
                    level?: string | null | undefined;
                }[] | null | undefined;
                apply_url?: string | null | undefined;
                apply_phone?: string | null | undefined;
                apply_email?: string | null | undefined;
                published_at?: string | null | undefined;
                updated_at?: string | null | undefined;
                expires_at?: string | null | undefined;
                ideaType?: string | null | undefined;
                contact?: any;
                target_diploma_level?: string | null | undefined;
                rythmeAlternance?: any;
                elligibleHandicap?: boolean | null | undefined;
                dureeContrat?: string | null | undefined;
                quantiteContrat?: number | null | undefined;
                recipient_id?: string | null | undefined;
                url?: string | null | undefined;
                applicationCount?: number | null | undefined;
                token?: string | null | undefined;
            }[];
        } | null | undefined;
        lbaCompanies?: {
            results: any[];
        } | null | undefined;
        lbbCompanies?: {
            results: any[];
        } | null | undefined;
    }>;
    getOffer(id: string): Promise<{
        id: string;
        title: string;
        description?: string | null | undefined;
        type?: string[] | null | undefined;
        status?: string | null | undefined;
        company?: {
            description?: string | null | undefined;
            name?: string | null | undefined;
            siret?: string | null | undefined;
            size?: string | null | undefined;
        } | undefined;
        place?: {
            city?: string | null | undefined;
            postalCode?: string | null | undefined;
            zipCode?: string | null | undefined;
            department?: string | null | undefined;
            region?: string | null | undefined;
            inseeCode?: string | null | undefined;
            latitude?: number | null | undefined;
            longitude?: number | null | undefined;
            distance?: number | null | undefined;
            fullAddress?: string | null | undefined;
            address?: string | null | undefined;
        } | undefined;
        contract?: {
            type?: string | null | undefined;
            duration?: number | null | undefined;
            workMode?: string | null | undefined;
        } | undefined;
        job?: {
            id?: string | null | undefined;
            description?: string | null | undefined;
            contractType?: string | null | undefined;
            creationDate?: string | null | undefined;
            jobStartDate?: string | null | undefined;
            jobExpirationDate?: string | null | undefined;
            romeDetails?: any;
        } | undefined;
        salary?: {
            description?: string | null | undefined;
            min?: number | null | undefined;
            max?: number | null | undefined;
            period?: string | null | undefined;
        } | undefined;
        rome_codes?: string[] | null | undefined;
        naf_code?: string | null | undefined;
        skills?: string[] | null | undefined;
        nafs?: any[] | null | undefined;
        degree_min?: string | null | undefined;
        experience_min?: number | null | undefined;
        languages?: {
            language: string;
            level?: string | null | undefined;
        }[] | null | undefined;
        apply_url?: string | null | undefined;
        apply_phone?: string | null | undefined;
        apply_email?: string | null | undefined;
        published_at?: string | null | undefined;
        updated_at?: string | null | undefined;
        expires_at?: string | null | undefined;
        ideaType?: string | null | undefined;
        contact?: any;
        target_diploma_level?: string | null | undefined;
        rythmeAlternance?: any;
        elligibleHandicap?: boolean | null | undefined;
        dureeContrat?: string | null | undefined;
        quantiteContrat?: number | null | undefined;
        recipient_id?: string | null | undefined;
        url?: string | null | undefined;
        applicationCount?: number | null | undefined;
        token?: string | null | undefined;
    }>;
    fetchAllOffers(params?: LBASearchParams): AsyncGenerator<any[], void, unknown>;
    mapToCanonical(lbaOffer: LBAOffer): any;
    private mapContractType;
    private mapWorkMode;
}

export { LBAClient, type LBAClientConfig, type LBAOffer, LBAOfferSchema, type LBAResponse, type LBASearchParams };
