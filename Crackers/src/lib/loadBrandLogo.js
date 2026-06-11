import brandLogo from '../assets/logo.jpg';

export async function loadBrandLogo() {
  try {
    const response = await fetch(brandLogo);
    if (!response.ok) return brandLogo;

    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return brandLogo;
  }
}

export { brandLogo };
