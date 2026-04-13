export const applyTheme = (theme: any) => {
  const primary = theme.primaryColor || '#15803d';
  document.documentElement.style.setProperty('--primary', primary);
  document.body.style.setProperty('--primary', primary);
};
