export const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(word => /[a-z0-9]/i.test(word))
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase()
