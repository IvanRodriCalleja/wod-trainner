/**
 * LiquidMetal Text Shader - Optimized for text rendering
 *
 * Key differences from the standard shader:
 * - Lighting is based on the shape's edge gradient, not global UV position
 * - No harsh darkening from position-based bump calculations
 * - Maintains bright metallic appearance across all text shapes
 */

export const liquidMetalTextShader = `
uniform shader u_image;
uniform float2 u_resolution;
uniform float u_time;

uniform half4 u_colorBack;
uniform half4 u_colorTint;
uniform half3 u_colorLight;
uniform half3 u_colorDark;

uniform float u_softness;
uniform float u_repetition;
uniform float u_shiftRed;
uniform float u_shiftBlue;
uniform float u_distortion;
uniform float u_angle;
uniform float u_speed;

uniform float u_animationMode;
uniform float u_pattern;
uniform float u_material;

const float TWO_PI = 6.28318530718;
const float PI = 3.14159265358979323846;

float3 permute(float3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(float2 v) {
  const float4 C = float4(0.211324865405187, 0.366025403784439,
    -0.577350269189626, 0.024390243902439);
  float2 i = floor(v + dot(v, C.yy));
  float2 x0 = v - i + dot(i, C.xx);
  float2 i1;
  i1 = (x0.x > x0.y) ? float2(1.0, 0.0) : float2(0.0, 1.0);
  float4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  float3 p = permute(permute(i.y + float3(0.0, i1.y, 1.0))
    + i.x + float3(0.0, i1.x, 1.0));
  float3 m = max(0.5 - float3(dot(x0, x0), dot(x12.xy, x12.xy),
      dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  float3 x = 2.0 * fract(p * C.www) - 1.0;
  float3 h = abs(x) - 0.5;
  float3 ox = floor(x + 0.5);
  float3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  float3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float3 hsv2rgb(float3 c) {
  float4 K = float4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  float3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

half4 main(float2 coord) {
  float2 uv = coord / u_resolution;

  // Sample the processed image
  // R = edge gradient (0 = edge, 1 = interior)
  // G = alpha/opacity
  float4 img = u_image.eval(coord);

  float edge = img.r;
  float opacity = img.g;

  // If outside the shape, return background
  if (opacity < 0.01) {
    return half4(u_colorBack.rgb * u_colorBack.a, u_colorBack.a);
  }

  // Animation time
  float t = 0.0;
  if (u_animationMode < 0.5) {
    // flow
    t = u_time * 0.3;
  } else if (u_animationMode < 1.5) {
    // still
    t = 0.0;
  } else if (u_animationMode < 2.5) {
    // pulse
    t = 0.1 * sin(u_time * 2.0);
  } else if (u_animationMode < 3.5) {
    // ripple
    t = u_time * 0.3;
  } else if (u_animationMode < 4.5) {
    // shimmer
    t = 0.05 * sin(u_time * 8.0);
  } else {
    // rotate
    t = u_time * 0.5;
  }

  // Calculate stripe direction based on angle
  float angle = (u_angle + (u_animationMode >= 5.5 ? u_time * 30.0 : 0.0)) * PI / 180.0;
  float2 dir = float2(cos(angle), sin(angle));

  // Base direction for stripes - using UV position along angle
  float direction = dot(uv - 0.5, dir) + 0.5;

  // Add pattern variation
  if (u_pattern > 0.5 && u_pattern < 1.5) {
    // radial
    direction = length(uv - 0.5) * 1.5;
  } else if (u_pattern >= 1.5 && u_pattern < 2.5) {
    // concentric
    direction = length(uv - 0.5) * 3.0;
  } else if (u_pattern >= 2.5 && u_pattern < 3.5) {
    // diagonal-cross
    direction = abs(uv.x - uv.y) + abs(uv.x + uv.y - 1.0);
  } else if (u_pattern >= 3.5) {
    // noise
    direction = snoise(uv * 2.0 + t) * 0.5 + 0.5;
  }

  // Add ripple effect
  if (u_animationMode >= 2.5 && u_animationMode < 3.5) {
    float ripple = sin(length(uv - 0.5) * 15.0 - u_time * 4.0) * 0.1;
    direction += ripple;
  }

  // Add noise for organic feel
  float noise = snoise(uv * 3.0 - t) * u_distortion;
  direction += noise;

  // Use edge to create depth - but keep it subtle, not darkening
  // Edge gradient creates the 3D beveled look
  float edgeInfluence = smoothstep(0.0, 0.5, edge);

  // Modulate direction slightly by edge for depth effect
  direction += (1.0 - edgeInfluence) * 0.15;

  // Scale by repetition and add time for animation
  direction = direction * u_repetition - t;

  // Color setup
  float3 colorLight = float3(u_colorLight);
  float3 colorDark = float3(u_colorDark);

  // Material modifications
  if (u_material > 0.5 && u_material < 1.5) {
    // chrome - higher contrast
    colorLight = mix(colorLight, float3(1.0), 0.2);
    colorDark = mix(colorDark, float3(0.2), 0.2);
  } else if (u_material >= 2.5 && u_material < 3.5) {
    // holographic
    float hue = fract(direction * 0.3 + t * 0.1);
    float3 rainbow = hsv2rgb(float3(hue, 0.5, 1.0));
    colorLight = mix(colorLight, rainbow, 0.4);
    colorDark = mix(colorDark, rainbow * 0.4, 0.3);
  } else if (u_material >= 3.5 && u_material < 4.5) {
    // pearl
    float shift = sin(direction * 2.0) * 0.1;
    colorLight.r += shift;
    colorLight.b -= shift;
  } else if (u_material >= 5.5) {
    // oil-slick
    float hue = fract(length(uv - 0.5) + direction * 0.2 + t * 0.1);
    float3 rainbow = hsv2rgb(float3(hue, 0.7, 0.9));
    colorLight = mix(float3(0.3), rainbow, 0.6);
    colorDark = float3(0.05);
  }

  // Create the stripe pattern - smooth metallic bands
  float blur = u_softness * 0.5 + 0.02;

  // Stripe pattern with smooth transitions
  float stripe = fract(direction);

  // Multi-band metallic pattern
  float band1 = smoothstep(0.0, blur, stripe) * (1.0 - smoothstep(0.15, 0.15 + blur, stripe));
  float band2 = smoothstep(0.2, 0.2 + blur, stripe) * (1.0 - smoothstep(0.5, 0.5 + blur, stripe));
  float band3 = smoothstep(0.55, 0.55 + blur, stripe) * (1.0 - smoothstep(0.85, 0.85 + blur, stripe));
  float band4 = smoothstep(0.9, 0.9 + blur, stripe);

  // Combine bands into light/dark pattern
  float lightAmount = band1 + band2 * 0.7 + band4;
  lightAmount = clamp(lightAmount, 0.0, 1.0);

  // Mix between light and dark based on pattern
  float3 baseColor = mix(colorDark, colorLight, lightAmount);

  // Add edge highlight - brighter at edges for that metallic rim light
  float edgeHighlight = (1.0 - edgeInfluence) * 0.3;
  baseColor = mix(baseColor, colorLight, edgeHighlight);

  // Chromatic aberration for that liquid metal look
  float dispersionR = u_shiftRed * 0.02;
  float dispersionB = u_shiftBlue * 0.02;

  float stripeR = fract(direction + dispersionR);
  float stripeB = fract(direction - dispersionB);

  float lightR = smoothstep(0.0, blur, stripeR) * (1.0 - smoothstep(0.15, 0.15 + blur, stripeR)) +
                 smoothstep(0.2, 0.2 + blur, stripeR) * (1.0 - smoothstep(0.5, 0.5 + blur, stripeR)) * 0.7 +
                 smoothstep(0.9, 0.9 + blur, stripeR);
  float lightB = smoothstep(0.0, blur, stripeB) * (1.0 - smoothstep(0.15, 0.15 + blur, stripeB)) +
                 smoothstep(0.2, 0.2 + blur, stripeB) * (1.0 - smoothstep(0.5, 0.5 + blur, stripeB)) * 0.7 +
                 smoothstep(0.9, 0.9 + blur, stripeB);

  float3 color;
  color.r = mix(colorDark.r, colorLight.r, clamp(lightR, 0.0, 1.0));
  color.g = baseColor.g;
  color.b = mix(colorDark.b, colorLight.b, clamp(lightB, 0.0, 1.0));

  // Add edge highlight to final color
  color = mix(color, colorLight, edgeHighlight);

  // Apply tint with color burn blend
  float3 tint = float3(u_colorTint.rgb);
  color = mix(color, 1.0 - min(float3(1.0), (1.0 - color) / max(tint, float3(0.001))), u_colorTint.a * 0.3);

  // Ensure we don't go too dark - minimum brightness based on light color
  float minBrightness = (colorLight.r + colorLight.g + colorLight.b) / 3.0 * 0.25;
  float currentBrightness = (color.r + color.g + color.b) / 3.0;
  if (currentBrightness < minBrightness) {
    color = mix(color, colorLight * 0.4, (minBrightness - currentBrightness) / minBrightness);
  }

  // Apply opacity
  color *= opacity;

  // Blend with background
  float3 bgColor = u_colorBack.rgb * u_colorBack.a;
  color = color + bgColor * (1.0 - opacity);
  float finalAlpha = opacity + u_colorBack.a * (1.0 - opacity);

  // Dithering to reduce banding
  float dither = fract(sin(dot(coord * 0.01, float2(12.9898, 78.233))) * 43758.5453);
  color += (dither - 0.5) / 255.0;

  return half4(half3(color), half(finalAlpha));
}
`;
