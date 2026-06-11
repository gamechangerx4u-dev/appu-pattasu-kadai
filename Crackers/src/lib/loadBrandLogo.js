const LOGO_PATH = '/logo.jpg';

export async function loadBrandLogo() {
  try {
    const response = await fetch(LOGO_PATH);
    if (!response.ok) return null;

    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}
