import { z } from 'zod'

export const EducationLevelSchema = z.enum([
  'high_school',
  '2yr_diploma',
  '3yr_degree',
  'bachelors',
  'masters',
  'phd',
])

export const ProvinceCodeSchema = z.enum([
  'BC', 'AB', 'SK', 'MB', 'ON', 'NB', 'NS', 'PE', 'NL', 'NT', 'YT',
])

export const LocationPreferenceSchema = z.enum([
  'metro', 'regional', 'rural', 'flexible',
])

export const UserProfileSchema = z.object({
  age: z.number().int().min(18).max(75),
  citizenshipCountry: z.string().length(2),
  currentResidence: z.string().length(2),

  clbEnglish: z.number().int().min(1).max(12).nullable(),
  clbFrench: z.number().int().min(1).max(12).nullable(),

  highestEducation: EducationLevelSchema,
  educationCountry: z.string().length(2),
  hasCanadianDegree: z.boolean(),
  canadianDegreeProvince: ProvinceCodeSchema.nullable(),
  canadianDegreeLength: z.number().int().min(1).max(10).nullable(),
  hasECA: z.boolean(),

  businessOwnershipYears: z.number().int().min(0).max(50),
  ownershipPercentage: z.number().int().min(0).max(100),
  seniorManagementYears: z.number().int().min(0).max(50),
  employeesManaged: z.number().int().min(0),
  businessSector: z.string().min(1),
  annualRevenue: z.number().min(0).nullable(),

  personalNetWorth: z.number().min(0),
  liquidAssets: z.number().min(0),
  investmentCapacity: z.number().min(0),

  hasExploratoryVisit: z.boolean(),
  exploratoryVisitProvince: ProvinceCodeSchema.nullable(),
  exploratoryVisitDays: z.number().int().min(0).nullable(),
  hasCommunityReferral: z.boolean(),
  communityReferralProvince: ProvinceCodeSchema.nullable(),
  hasCanadianWorkExperience: z.boolean(),
  canadianWorkProvince: ProvinceCodeSchema.nullable(),
  hasFamilyInCanada: z.boolean(),
  familyProvince: ProvinceCodeSchema.nullable(),

  intendedProvince: z.array(ProvinceCodeSchema).min(0),
  intendedLocation: LocationPreferenceSchema,
  intendedJobCreation: z.number().int().min(0),
  hasPGWP: z.boolean(),

  isRecentGraduate: z.boolean(),
  hasOperatingBusiness: z.boolean(),
  operatingBusinessProvince: ProvinceCodeSchema.nullable(),
  operatingBusinessMonths: z.number().int().min(0).nullable(),
})

export type ValidatedUserProfile = z.infer<typeof UserProfileSchema>
