# Image Placeholder Components

## Overview

Two optimized image components with loading states, error handling, and graceful fallbacks for production-ready e-commerce experience.

---

## 1. ImagePlaceholder Component

**Location:** `src/components/ImagePlaceholder.jsx`

Handles product images with skeleton loader and error fallback.

### Features
- ✅ **Skeleton loader** — Animated shimmer while loading
- ✅ **Error handling** — Fallback UI if image fails to load
- ✅ **Lazy loading** — Loads images only when in viewport
- ✅ **Memoized** — Prevents unnecessary re-renders
- ✅ **Accessible** — Alt text support

### Usage

**Basic:**
```jsx
import ImagePlaceholder from './components/ImagePlaceholder';

<ImagePlaceholder
  src="https://example.com/product.jpg"
  alt="Product name"
/>
```

**With options:**
```jsx
<ImagePlaceholder
  src={product.image}
  alt={product.name}
  width="100%"
  height="220px"
  lazy={true}
  onLoad={() => console.log('Image loaded')}
  onError={() => console.log('Image failed')}
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | string | Required | Image URL |
| `alt` | string | "Product image" | Alt text for accessibility |
| `width` | string | "100%" | CSS width |
| `height` | string | "220px" | CSS height |
| `objectFit` | string | "contain" | CSS object-fit |
| `lazy` | boolean | true | Enable lazy loading |
| `onLoad` | function | undefined | Callback when image loads |
| `onError` | function | undefined | Callback on error |
| `className` | string | "product-card-img" | CSS class name |

### States

1. **Loading** — Shows animated shimmer skeleton
2. **Loaded** — Image displays smoothly
3. **Error** — Shows fallback UI with icon + message

### Example Output

**Loading state:**
```
┌─────────────────┐
│ ▓▓░░▓▓░░▓▓░░▓▓  │  (animated shimmer)
└─────────────────┘
```

**Error state:**
```
┌─────────────────┐
│       📸        │
│  Image unavailable
└─────────────────┘
```

---

## 2. HeroImage Component

**Location:** `src/components/HeroImage.jsx`

Optimized for banner/hero images with responsive sizing.

### Features
- ✅ **Responsive sizing** — Adapts to screen size
- ✅ **Gradient skeleton** — Professional loading state
- ✅ **Color fallback** — Gradient background on error
- ✅ **SEO-friendly** — Alt text support
- ✅ **Memoized** — Prevents unnecessary re-renders

### Usage

**Basic:**
```jsx
import HeroImage from './components/HeroImage';

<HeroImage
  src="https://example.com/hero.jpg"
  alt="Hero banner"
/>
```

**With callbacks:**
```jsx
<HeroImage
  src={heroImageUrl}
  alt="Seasonal banner"
  onLoad={() => console.log('Banner ready')}
  onError={() => console.log('Banner failed')}
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | string | Required | Image URL |
| `alt` | string | "Hero banner" | Alt text |
| `onLoad` | function | undefined | Callback when loaded |
| `onError` | function | undefined | Callback on error |

### States

1. **Loading** — Animated gradient skeleton (height: 400px)
2. **Loaded** — Image displays responsively
3. **Error** — Gradient background fallback

---

## Integration in ProductCard

ProductCard already integrated:

```jsx
import ImagePlaceholder from './ImagePlaceholder';

export const ProductCard = React.memo(({ product, ... }) => {
  return (
    <ImagePlaceholder
      src={product.image}
      alt={product.name}
      width="100%"
      height="220px"
      lazy={true}
    />
  );
});
```

---

## Shimmer Animation

Both components use CSS shimmer animation:

```css
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

Applied when loading, creates smooth left-to-right movement.

---

## Performance Benefits

| Metric | Benefit |
|--------|---------|
| **Perceived Performance** | Shimmer skeleton feels faster than blank space |
| **User Experience** | Smooth transitions, no jarring image pop-in |
| **Lazy Loading** | Images only load when scrolled into view |
| **Bundle Size** | Components < 3KB each (minified) |
| **Network** | Reduces initial payload for images |

---

## Accessibility

✅ **Alt text** — All images have descriptive alt text
✅ **Semantic HTML** — Proper `<img>` tags with attributes
✅ **Error handling** — Fallback UI for image load failures
✅ **Keyboard** — No keyboard traps or focus issues
✅ **Contrast** — Fallback colors meet WCAG standards

---

## Browser Support

- Chrome/Edge ✅
- Firefox ✅
- Safari ✅
- Mobile browsers ✅

CSS animations degrade gracefully on older browsers.

---

## Future Enhancements

### Planned
- [ ] AVIF format support with fallback
- [ ] Progressive image loading (blur → sharp)
- [ ] Image optimization API integration
- [ ] Caching strategies for offline support

### Optional
- [ ] Picture element support for responsive images
- [ ] srcset for different screen sizes
- [ ] WebP format detection
- [ ] Analytics tracking for image performance

---

## Testing

### Manual
1. Open app in browser
2. Scroll product grid — observe shimmer loaders
3. Wait for images to load
4. Verify smooth fade-in (no flashing)
5. Test error state by changing image URL

### Automated
```javascript
// Test shimmer visibility
const shimmer = screen.getByRole('img').closest('div');
expect(shimmer).toHaveStyle('animation: shimmer 2s infinite');

// Test alt text
const img = screen.getByAltText('Product name');
expect(img).toBeInTheDocument();
```

---

## SEO Impact

- ✅ Alt text on all images
- ✅ Lazy loading reduces page bloat
- ✅ Proper image sizing (no layout shift)
- ✅ Fallback text in error state
- ✅ Semantic HTML structure

---

## File Structure

```
src/
├── components/
│   ├── ImagePlaceholder.jsx    ← Product images
│   ├── HeroImage.jsx           ← Banner images
│   ├── ProductCard.jsx         ← Uses ImagePlaceholder
│   └── ...
└── ...
```

---

## References

- [MDN: Lazy Loading](https://developer.mozilla.org/en-US/docs/Web/Performance/Lazy_loading)
- [Web.dev: Image Optimization](https://web.dev/image-optimization/)
- [React Memo: Performance](https://react.dev/reference/react/memo)

---

**Created:** 6 May 2026
**Status:** ✅ Production Ready
