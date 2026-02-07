// Simple utility to check password safely
export const checkAdminPassword = (input: string): boolean => {
  // Target password: "zxcasd123"
  // Base64 encoded: "enhjYXNkMTIz"
  // This avoids storing the plain text password in the source code.
  try {
    return btoa(input) === 'enhjYXNkMTIz';
  } catch (e) {
    return false;
  }
};

export const checkEntryPassword = (input: string): boolean => {
  // Target password: "3323"
  // Base64 encoded: "MzMyMw=="
  try {
    return btoa(input) === 'MzMyMw==';
  } catch (e) {
    return false;
  }
};