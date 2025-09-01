'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

interface UserProfile {
  id?: string
  phone?: string
  linkedin_url?: string
  github_url?: string
  website_url?: string
  bio?: string
  location?: string
  skills?: string[]
  experience_years?: number
  current_position?: string
  current_company?: string
  preferences?: any
}

export default function UserProfileForm() {
  const { user } = useUser()
  const [profile, setProfile] = useState<UserProfile>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [skillInput, setSkillInput] = useState('')

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile || {})
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profile)
      })

      if (response.ok) {
        toast.success('Profil mis à jour avec succès')
      } else {
        throw new Error('Failed to save profile')
      }
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde du profil')
      console.error('Failed to save profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const addSkill = () => {
    if (skillInput.trim() && !profile.skills?.includes(skillInput.trim())) {
      setProfile(prev => ({
        ...prev,
        skills: [...(prev.skills || []), skillInput.trim()]
      }))
      setSkillInput('')
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills?.filter(skill => skill !== skillToRemove) || []
    }))
  }

  const updateProfile = (field: keyof UserProfile, value: any) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informations Personnelles</CardTitle>
          <CardDescription>
            Ces informations vous aident à personnaliser votre expérience sur la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                type="tel"
                value={profile.phone || ''}
                onChange={(e) => updateProfile('phone', e.target.value)}
                placeholder="+33 6 12 34 56 78"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Localisation</Label>
              <Input
                id="location"
                value={profile.location || ''}
                onChange={(e) => updateProfile('location', e.target.value)}
                placeholder="Paris, France"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Biographie</Label>
            <Textarea
              id="bio"
              value={profile.bio || ''}
              onChange={(e) => updateProfile('bio', e.target.value)}
              placeholder="Décrivez-vous en quelques mots..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Professional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informations Professionnelles</CardTitle>
          <CardDescription>
            Aidez-nous à mieux comprendre votre parcours professionnel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="current_position">Poste Actuel</Label>
              <Input
                id="current_position"
                value={profile.current_position || ''}
                onChange={(e) => updateProfile('current_position', e.target.value)}
                placeholder="Développeur Full-Stack"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current_company">Entreprise Actuelle</Label>
              <Input
                id="current_company"
                value={profile.current_company || ''}
                onChange={(e) => updateProfile('current_company', e.target.value)}
                placeholder="Tech Corp"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience_years">Années d'Expérience</Label>
            <Input
              id="experience_years"
              type="number"
              min="0"
              max="50"
              value={profile.experience_years || ''}
              onChange={(e) => updateProfile('experience_years', parseInt(e.target.value) || 0)}
              placeholder="5"
            />
          </div>

          {/* Skills Section */}
          <div className="space-y-2">
            <Label>Compétences</Label>
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Ajouter une compétence..."
                onKeyPress={(e) => e.key === 'Enter' && addSkill()}
              />
              <Button onClick={addSkill} type="button">
                Ajouter
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {profile.skills?.map((skill, index) => (
                <Badge key={index} variant="secondary">
                  {skill}
                  <button
                    onClick={() => removeSkill(skill)}
                    className="ml-2 hover:text-red-500"
                    type="button"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle>Liens Sociaux</CardTitle>
          <CardDescription>
            Partagez vos profils professionnels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="linkedin_url">LinkedIn</Label>
            <Input
              id="linkedin_url"
              type="url"
              value={profile.linkedin_url || ''}
              onChange={(e) => updateProfile('linkedin_url', e.target.value)}
              placeholder="https://linkedin.com/in/votre-profil"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="github_url">GitHub</Label>
            <Input
              id="github_url"
              type="url"
              value={profile.github_url || ''}
              onChange={(e) => updateProfile('github_url', e.target.value)}
              placeholder="https://github.com/votre-username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website_url">Site Web</Label>
            <Input
              id="website_url"
              type="url"
              value={profile.website_url || ''}
              onChange={(e) => updateProfile('website_url', e.target.value)}
              placeholder="https://votre-site.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveProfile} disabled={saving} size="lg">
          {saving ? 'Sauvegarde...' : 'Sauvegarder le Profil'}
        </Button>
      </div>
    </div>
  )
}