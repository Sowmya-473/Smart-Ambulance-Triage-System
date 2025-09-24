/**
 * Text formatting utilities for consistent text display across the application
 */

/**
 * Converts text to proper title case
 * Examples: 
 * - "hello world" -> "Hello World"
 * - "HELLO WORLD" -> "Hello World" 
 * - "hELLo WoRLd" -> "Hello World"
 */
export function toTitleCase(str: string): string {
  if (!str || typeof str !== 'string') return '';
  
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Converts text to sentence case (first letter capitalized, rest lowercase)
 * Examples:
 * - "hello world" -> "Hello world"
 * - "HELLO WORLD" -> "Hello world"
 */
export function toSentenceCase(str: string): string {
  if (!str || typeof str !== 'string') return '';
  
  const cleaned = str.toLowerCase().trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Formats medical condition names properly
 * Handles special medical terms and acronyms
 */
export function formatMedicalCondition(condition: string): string {
  if (!condition || typeof condition !== 'string') return '';
  
  // Convert to title case first
  let formatted = toTitleCase(condition);
  
  // Handle common medical acronyms that should stay uppercase
  const medicalAcronyms = ['ICU', 'ER', 'CT', 'MRI', 'EKG', 'ECG', 'IV', 'OR', 'COPD', 'HIV', 'AIDS', 'UTI', 'PTSD'];
  medicalAcronyms.forEach(acronym => {
    const regex = new RegExp(`\\b${acronym.toLowerCase()}\\b`, 'gi');
    formatted = formatted.replace(regex, acronym);
  });
  
  return formatted;
}

/**
 * Formats hospital names by cleaning up common formatting issues
 */
export function formatHospitalName(name: string): string {
  if (!name || typeof name !== 'string') return '';
  
  let formatted = name.trim();
  
  // Remove excessive numbers/codes at the beginning
  formatted = formatted.replace(/^\d+\s*/, '');
  
  // Clean up common government prefixes
  formatted = formatted.replace(/^(GOVT\.|GOV\.|GOVERNMENT)\s*/i, 'Government ');
  
  // Convert to title case
  formatted = toTitleCase(formatted);
  
  // Fix common medical institution terms
  const institutionTerms = {
    'Medical College': 'Medical College',
    'Hospital': 'Hospital',
    'Institute': 'Institute',
    'Centre': 'Centre',
    'Center': 'Center',
    'Clinic': 'Clinic',
    'Healthcare': 'Healthcare',
    'Medical': 'Medical'
  };
  
  Object.entries(institutionTerms).forEach(([key, value]) => {
    const regex = new RegExp(`\\b${key}\\b`, 'gi');
    formatted = formatted.replace(regex, value);
  });
  
  return formatted;
}

/**
 * Formats addresses by cleaning up and properly capitalizing
 */
export function formatAddress(address: string): string {
  if (!address || typeof address !== 'string') return '';
  
  let formatted = address.trim();
  
  // Convert to title case
  formatted = toTitleCase(formatted);
  
  // Fix common address terms
  const addressTerms = {
    'road': 'Road',
    'street': 'Street',
    'avenue': 'Avenue',
    'lane': 'Lane',
    'cross': 'Cross',
    'main': 'Main',
    'nagar': 'Nagar',
    'colony': 'Colony'
  };
  
  Object.entries(addressTerms).forEach(([key, value]) => {
    const regex = new RegExp(`\\b${key}\\b`, 'gi');
    formatted = formatted.replace(regex, value);
  });
  
  return formatted;
}

/**
 * Formats department names consistently
 */
export function formatDepartmentName(department: string): string {
  if (!department || typeof department !== 'string') return '';
  
  // Special handling for medical departments
  const departmentMappings: { [key: string]: string } = {
    'general medicine': 'General Medicine',
    'emergency medicine': 'Emergency Medicine',
    'cardiology': 'Cardiology',
    'neurology': 'Neurology',
    'orthopedics': 'Orthopedics',
    'pediatrics': 'Pediatrics',
    'surgery': 'Surgery',
    'internal medicine': 'Internal Medicine',
    'family medicine': 'Family Medicine',
    'critical care': 'Critical Care',
    'intensive care': 'Intensive Care'
  };
  
  const lowerDept = department.toLowerCase().trim();
  return departmentMappings[lowerDept] || toTitleCase(department);
}

/**
 * Formats patient names properly
 */
export function formatPatientName(name: string): string {
  if (!name || typeof name !== 'string') return '';
  
  return toTitleCase(name.trim());
}

/**
 * Formats blood type consistently
 */
export function formatBloodType(bloodType: string): string {
  if (!bloodType || typeof bloodType !== 'string') return '';
  
  return bloodType.toUpperCase().trim();
}

/**
 * Formats severity levels with proper casing
 */
export function formatSeverity(severity: string): string {
  if (!severity || typeof severity !== 'string') return '';
  
  const severityMappings: { [key: string]: string } = {
    'low': 'Low',
    'medium': 'Medium', 
    'high': 'High',
    'critical': 'Critical'
  };
  
  const lowerSeverity = severity.toLowerCase().trim();
  return severityMappings[lowerSeverity] || toTitleCase(severity);
}

/**
 * Formats gender consistently
 */
export function formatGender(gender: string): string {
  if (!gender || typeof gender !== 'string') return '';
  
  const genderMappings: { [key: string]: string } = {
    'm': 'Male',
    'male': 'Male',
    'f': 'Female', 
    'female': 'Female',
    'o': 'Other',
    'other': 'Other'
  };
  
  const lowerGender = gender.toLowerCase().trim();
  return genderMappings[lowerGender] || toTitleCase(gender);
}

/**
 * Truncates text to a specified length and adds ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || typeof text !== 'string') return '';
  
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Formats contact numbers consistently
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone || typeof phone !== 'string') return '';
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length === 10) {
    // Format as (XXX) XXX-XXXX
    return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
  } else if (digits.length === 11 && digits[0] === '1') {
    // Format as +1 (XXX) XXX-XXXX
    return `+1 (${digits.substring(1, 4)}) ${digits.substring(4, 7)}-${digits.substring(7)}`;
  }
  
  return phone; // Return original if format not recognized
}
