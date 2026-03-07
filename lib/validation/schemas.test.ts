import { describe, it, expect } from 'vitest'
import { UserProfileSchema } from './schemas'

describe('UserProfileSchema', () => {
  const validProfile = {
    age: 35,
    citizenshipCountry: 'IR',
    currentResidence: 'AE',
    clbEnglish: 7,
    clbFrench: null,
    highestEducation: 'bachelors',
    educationCountry: 'IR',
    hasCanadianDegree: false,
    canadianDegreeProvince: null,
    canadianDegreeLength: null,
    hasECA: true,
    businessOwnershipYears: 5,
    ownershipPercentage: 100,
    seniorManagementYears: 0,
    employeesManaged: 12,
    businessSector: '54',
    annualRevenue: 500000,
    personalNetWorth: 800000,
    liquidAssets: 400000,
    investmentCapacity: 300000,
    hasExploratoryVisit: true,
    exploratoryVisitProvince: 'BC',
    exploratoryVisitDays: 5,
    hasCommunityReferral: false,
    communityReferralProvince: null,
    hasCanadianWorkExperience: false,
    canadianWorkProvince: null,
    hasFamilyInCanada: false,
    familyProvince: null,
    intendedProvince: ['BC', 'AB'],
    intendedLocation: 'regional',
    intendedJobCreation: 2,
    hasPGWP: false,
    isRecentGraduate: false,
    hasOperatingBusiness: false,
    operatingBusinessProvince: null,
    operatingBusinessMonths: null,
  }

  it('accepts a valid full profile', () => {
    expect(UserProfileSchema.parse(validProfile)).toEqual(validProfile)
  })

  it('rejects age below 18', () => {
    expect(() => UserProfileSchema.parse({ ...validProfile, age: 15 })).toThrow()
  })

  it('rejects age above 75', () => {
    expect(() => UserProfileSchema.parse({ ...validProfile, age: 80 })).toThrow()
  })

  it('rejects invalid education level', () => {
    expect(() =>
      UserProfileSchema.parse({ ...validProfile, highestEducation: 'kindergarten' })
    ).toThrow()
  })

  it('rejects negative net worth', () => {
    expect(() => UserProfileSchema.parse({ ...validProfile, personalNetWorth: -1 })).toThrow()
  })

  it('rejects CLB outside 1-12 range', () => {
    expect(() => UserProfileSchema.parse({ ...validProfile, clbEnglish: 15 })).toThrow()
  })

  it('allows CLB to be null (no test taken)', () => {
    const profile = { ...validProfile, clbEnglish: null, clbFrench: null }
    expect(() => UserProfileSchema.parse(profile)).not.toThrow()
  })

  it('allows empty intendedProvince array', () => {
    const profile = { ...validProfile, intendedProvince: [] }
    expect(() => UserProfileSchema.parse(profile)).not.toThrow()
  })

  it('rejects invalid province code', () => {
    expect(() =>
      UserProfileSchema.parse({ ...validProfile, exploratoryVisitProvince: 'XX' })
    ).toThrow()
  })

  it('rejects invalid location preference', () => {
    expect(() =>
      UserProfileSchema.parse({ ...validProfile, intendedLocation: 'downtown' })
    ).toThrow()
  })
})
