# Hero atmosphere markup

Use a decorative glow child with `aria-hidden="true"`, then put all meaningful hero content in a sibling child. The CSS raises non-glow children over the glow.

```html
<section class="hero-atmosphere" data-atmosphere="oss">
  <div class="hero-atmosphere__glow" aria-hidden="true"></div>
  <div class="hero-atmosphere__content">…</div>
</section>
```

The glow remains on the physical right at 86% 22%, ignores pointer events, and is disabled for forced colors and print.
