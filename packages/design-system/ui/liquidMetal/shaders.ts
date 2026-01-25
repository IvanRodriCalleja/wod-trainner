/**
 * LiquidMetal Shader - SKSL port for React Native Skia
 * Extended with multiple shapes, animation modes, materials, and patterns
 */

export const liquidMetalShader = `
uniform shader u_image;
uniform float2 u_resolution;
uniform float u_time;
uniform float u_imageAspectRatio;

uniform half4 u_colorBack;
uniform half4 u_colorTint;
uniform half3 u_colorLight;
uniform half3 u_colorDark;

uniform float u_softness;
uniform float u_repetition;
uniform float u_shiftRed;
uniform float u_shiftBlue;
uniform float u_distortion;
uniform float u_contour;
uniform float u_angle;

uniform float u_shape;
uniform float u_isImage;

uniform float u_scale;
uniform float u_fit;

// New uniforms
uniform float u_animationMode;  // 0=flow, 1=still, 2=pulse, 3=ripple, 4=shimmer, 5=rotate
uniform float u_pattern;        // 0=linear, 1=radial, 2=concentric, 3=diagonal-cross, 4=noise
uniform float u_material;       // 0=default, 1=chrome, 2=brushed, 3=holographic, 4=pearl, 5=glass, 6=oil-slick

const float TWO_PI = 6.28318530718;
const float PI = 3.14159265358979323846;

float2 rotate(float2 uv, float th) {
  float c = cos(th);
  float s = sin(th);
  return float2(uv.x * c - uv.y * s, uv.x * s + uv.y * c);
}

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

// Approximate fwidth using screen-space estimation
float estimateFwidth(float2 uv, float value) {
  float2 pixelSize = 1.0 / u_resolution;
  return length(pixelSize) * 0.5;
}

// HSV to RGB conversion for holographic effect
float3 hsv2rgb(float3 c) {
  float4 K = float4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  float3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float getColorChanges(float c1, float c2, float stripe_p, float3 w, float blur, float bump, float tint, half4 colorTint, float isImage) {
  float ch = mix(c2, c1, smoothstep(0.0, 2.0 * blur, stripe_p));

  float border = w.x;
  ch = mix(ch, c2, smoothstep(border, border + 2.0 * blur, stripe_p));

  float adjustedBump = bump;
  if (isImage > 0.5) {
    adjustedBump = smoothstep(0.2, 0.8, bump);
  }

  border = w.x + 0.4 * (1.0 - adjustedBump) * w.y;
  ch = mix(ch, c1, smoothstep(border, border + 2.0 * blur, stripe_p));

  border = w.x + 0.5 * (1.0 - adjustedBump) * w.y;
  ch = mix(ch, c2, smoothstep(border, border + 2.0 * blur, stripe_p));

  border = w.x + w.y;
  ch = mix(ch, c1, smoothstep(border, border + 2.0 * blur, stripe_p));

  float gradient_t = (stripe_p - w.x - w.y) / w.z;
  float gradient = mix(c1, c2, smoothstep(0.0, 1.0, gradient_t));
  ch = mix(ch, gradient, smoothstep(border, border + 0.5 * blur, stripe_p));

  // Tint color with color burn blending
  ch = mix(ch, 1.0 - min(1.0, (1.0 - ch) / max(tint, 0.0001)), colorTint.a);
  return ch;
}

float getImgFrame(float2 uv, float th) {
  float frame = 1.0;
  frame *= smoothstep(0.0, th + 0.001, uv.y);
  frame *= 1.0 - smoothstep(1.0 - th - 0.001, 1.0, uv.y);
  frame *= smoothstep(0.0, th + 0.001, uv.x);
  frame *= 1.0 - smoothstep(1.0 - th - 0.001, 1.0, uv.x);
  return frame;
}

// Blur edge 3x3 kernel for image sampling
float blurEdge3x3(float2 uv, float2 texelSize, float radius, float centerSample) {
  float2 r = radius * texelSize;

  float w1 = 1.0, w2 = 2.0, w4 = 4.0;
  float norm = 16.0;
  float sum = w4 * centerSample;

  sum += w2 * u_image.eval(uv + float2(0.0, -r.y)).r;
  sum += w2 * u_image.eval(uv + float2(0.0, r.y)).r;
  sum += w2 * u_image.eval(uv + float2(-r.x, 0.0)).r;
  sum += w2 * u_image.eval(uv + float2(r.x, 0.0)).r;

  sum += w1 * u_image.eval(uv + float2(-r.x, -r.y)).r;
  sum += w1 * u_image.eval(uv + float2(r.x, -r.y)).r;
  sum += w1 * u_image.eval(uv + float2(-r.x, r.y)).r;
  sum += w1 * u_image.eval(uv + float2(r.x, r.y)).r;

  return sum / norm;
}

// Shape: Heart
float heartShape(float2 uv) {
  uv = uv * 2.2;
  uv.y -= 0.3;
  float x = uv.x;
  float y = uv.y;
  float a = x * x + y * y - 1.0;
  float d = a * a * a - x * x * y * y * y;
  return d;
}

// Shape: Star (5-pointed)
float starShape(float2 uv, float points) {
  float a = atan(uv.y, uv.x) + PI;
  float r = length(uv);
  float n = points;
  float d = cos(floor(0.5 + a * n / TWO_PI) * TWO_PI / n - a) * r;
  return d;
}

// Shape: Hexagon
float hexagonShape(float2 uv) {
  uv = abs(uv);
  float d = max(uv.x * 0.866025 + uv.y * 0.5, uv.y);
  return d;
}

// Shape: Pill (rounded rectangle)
float pillShape(float2 uv, float radius) {
  float2 d = abs(uv) - float2(0.3, 0.15);
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - radius;
}

// Shape: Wave
float waveShape(float2 uv, float t) {
  float wave = sin(uv.x * 8.0 + t * 2.0) * 0.08;
  return abs(uv.y + wave) - 0.2;
}

// Shape: Blob (organic)
float blobShape(float2 uv, float t) {
  float r = length(uv);
  float a = atan(uv.y, uv.x);
  float f = 0.3 + 0.1 * sin(a * 3.0 + t) + 0.05 * sin(a * 5.0 - t * 1.5) + 0.03 * sin(a * 7.0 + t * 0.7);
  return r - f;
}

half4 main(float2 coord) {
  const float firstFrameOffset = 2.8;

  // Animation mode time calculation
  float t = 0.0;
  float animSpeed = 0.3;

  if (u_animationMode < 0.5) {
    // flow (default)
    t = animSpeed * (u_time + firstFrameOffset);
  } else if (u_animationMode < 1.5) {
    // still
    t = animSpeed * firstFrameOffset;
  } else if (u_animationMode < 2.5) {
    // pulse
    t = animSpeed * firstFrameOffset;
    animSpeed = 0.5 + 0.3 * sin(u_time * 2.0);
  } else if (u_animationMode < 3.5) {
    // ripple
    t = animSpeed * (u_time + firstFrameOffset);
  } else if (u_animationMode < 4.5) {
    // shimmer
    t = animSpeed * firstFrameOffset + 0.1 * sin(u_time * 8.0);
  } else {
    // rotate
    t = animSpeed * firstFrameOffset;
  }

  // Normalize to 0-1
  float2 uv = coord / u_resolution;

  // Flip Y to match WebGL convention
  uv.y = 1.0 - uv.y;

  float2 imageUV = uv;
  float2 objectUV = uv;

  // Handle aspect ratio and fit mode for images
  if (u_isImage > 0.5 && u_imageAspectRatio > 0.0) {
    float canvasAspect = u_resolution.x / u_resolution.y;
    float imageAspect = u_imageAspectRatio;

    float2 centeredUV = uv - 0.5;

    // Apply scale
    centeredUV /= u_scale;

    if (u_fit > 0.5 && u_fit < 1.5) {
      // Contain
      if (canvasAspect > imageAspect) {
        centeredUV.x *= canvasAspect / imageAspect;
      } else {
        centeredUV.y *= imageAspect / canvasAspect;
      }
    } else if (u_fit >= 1.5) {
      // Cover
      if (canvasAspect > imageAspect) {
        centeredUV.y *= imageAspect / canvasAspect;
      } else {
        centeredUV.x *= canvasAspect / imageAspect;
      }
    }

    imageUV = centeredUV + 0.5;
  }

  // Apply scale for shapes
  float2 st = (uv - 0.5) / u_scale + 0.5;

  // Sample the processed image texture
  float4 img = u_image.eval(imageUV * u_resolution);

  float cycleWidth = u_repetition;
  float edge = 0.0;
  float opacity = 0.0;
  float contOffset = 1.0;

  // Calculate angle with rotation animation mode
  float effectiveAngle = u_angle;
  if (u_animationMode >= 5.5) {
    effectiveAngle += u_time * 30.0; // Rotate mode
  }

  // Calculate rotated UV for stripe direction
  float2 workingUV = (u_isImage > 0.5) ? imageUV : st;

  float2 rotatedUV = workingUV - float2(0.5);
  float angle = (-effectiveAngle + 70.0) * PI / 180.0;
  float cosA = cos(angle);
  float sinA = sin(angle);
  rotatedUV = float2(
    rotatedUV.x * cosA - rotatedUV.y * sinA,
    rotatedUV.x * sinA + rotatedUV.y * cosA
  ) + float2(0.5);

  float fw = estimateFwidth(workingUV, 0.0);

  if (u_isImage > 0.5) {
    // Image-based rendering
    float edgeRaw = img.r;
    float2 texelSize = 1.0 / u_resolution;
    edge = blurEdge3x3(imageUV * u_resolution, texelSize, 6.0, edgeRaw);
    edge = pow(edge, 1.6);
    edge *= mix(0.0, 1.0, smoothstep(0.0, 0.4, u_contour));

    opacity = img.g;
    float frame = getImgFrame(imageUV, 0.0);
    opacity *= frame;
  } else {
    // Shape rendering
    float2 shapeUV = st - 0.5;

    if (u_shape < 1.0) {
      // none - full fill
      float2 mask = min(st, 1.0 - st);
      float2 pixel_thickness = float2(0.1);
      float maskX = smoothstep(0.0, pixel_thickness.x, mask.x);
      float maskY = smoothstep(0.0, pixel_thickness.y, mask.y);
      maskX = pow(maskX, 0.25);
      maskY = pow(maskY, 0.25);
      edge = clamp(1.0 - maskX * maskY, 0.0, 1.0);
      opacity = 1.0;
      cycleWidth *= 2.0;
      contOffset = 1.5;
    } else if (u_shape < 2.0) {
      // circle
      shapeUV *= 0.67;
      edge = pow(clamp(3.0 * length(shapeUV), 0.0, 1.0), 18.0);
      opacity = 1.0 - smoothstep(0.9 - 2.0 * fw, 0.9, edge);
    } else if (u_shape < 3.0) {
      // daisy
      shapeUV *= 1.68;
      float r = length(shapeUV) * 2.0;
      float a = atan(shapeUV.y, shapeUV.x) + 0.2;
      r *= (1.0 + 0.05 * sin(3.0 * a + 2.0 * t));
      float f = abs(cos(a * 3.0));
      edge = smoothstep(f, f + 0.7, r);
      edge *= edge;
      opacity = 1.0 - smoothstep(0.9 - 2.0 * fw, 0.9, edge);
      cycleWidth *= 1.6;
    } else if (u_shape < 4.0) {
      // diamond
      shapeUV = rotate(shapeUV, 0.25 * PI);
      shapeUV *= 1.42;
      shapeUV += 0.5;
      float2 mask = min(shapeUV, 1.0 - shapeUV);
      float2 pixel_thickness = float2(0.15);
      float maskX = smoothstep(0.0, pixel_thickness.x, mask.x);
      float maskY = smoothstep(0.0, pixel_thickness.y, mask.y);
      maskX = pow(maskX, 0.25);
      maskY = pow(maskY, 0.25);
      edge = clamp(1.0 - maskX * maskY, 0.0, 1.0);
      opacity = 1.0 - smoothstep(0.9 - 2.0 * fw, 0.9, edge);
    } else if (u_shape < 5.0) {
      // metaballs
      shapeUV *= 1.3;
      edge = 0.0;
      for (int i = 0; i < 5; i++) {
        float fi = float(i);
        float speed = 1.5 + 2.0/3.0 * sin(fi * 12.345);
        float ballAngle = -fi * 1.5;
        float2 dir1 = float2(cos(ballAngle), sin(ballAngle));
        float2 dir2 = float2(cos(ballAngle + 1.57), sin(ballAngle + 1.0));
        float2 traj = 0.4 * (dir1 * sin(t * speed + fi * 1.23) + dir2 * cos(t * (speed * 0.7) + fi * 2.17));
        float d = length(shapeUV + traj);
        edge += pow(1.0 - clamp(d, 0.0, 1.0), 4.0);
      }
      edge = 1.0 - smoothstep(0.65, 0.9, edge);
      edge = pow(edge, 4.0);
      opacity = 1.0 - smoothstep(0.9 - 2.0 * fw, 0.9, edge);
    } else if (u_shape < 6.0) {
      // heart
      float d = heartShape(shapeUV);
      edge = smoothstep(-0.01, 0.15, d);
      edge = pow(edge, 2.0);
      opacity = 1.0 - smoothstep(-0.01, 0.02, d);
    } else if (u_shape < 7.0) {
      // star
      shapeUV *= 1.8;
      float d = starShape(shapeUV, 5.0);
      edge = smoothstep(0.15, 0.35, d);
      edge = pow(edge, 2.0);
      opacity = 1.0 - smoothstep(0.28, 0.32, d);
    } else if (u_shape < 8.0) {
      // hexagon
      shapeUV *= 1.5;
      float d = hexagonShape(shapeUV);
      edge = smoothstep(0.2, 0.4, d);
      edge = pow(edge, 2.0);
      opacity = 1.0 - smoothstep(0.35, 0.38, d);
    } else if (u_shape < 9.0) {
      // pill
      shapeUV *= 1.2;
      float d = pillShape(shapeUV, 0.12);
      edge = smoothstep(-0.05, 0.1, d);
      edge = pow(edge, 2.0);
      opacity = 1.0 - smoothstep(-0.01, 0.02, d);
    } else if (u_shape < 10.0) {
      // wave
      shapeUV *= 1.0;
      float d = waveShape(shapeUV, t);
      edge = smoothstep(-0.05, 0.15, abs(d));
      edge = pow(edge, 1.5);
      opacity = 1.0 - smoothstep(0.0, 0.03, abs(d) - 0.15);
    } else {
      // blob
      shapeUV *= 1.2;
      float d = blobShape(shapeUV, t);
      edge = smoothstep(-0.05, 0.15, d);
      edge = pow(edge, 2.0);
      opacity = 1.0 - smoothstep(-0.01, 0.02, d);
    }

    // Apply edge mix for contour
    edge = mix(smoothstep(0.9 - 2.0 * fw, 0.9, edge), edge, smoothstep(0.0, 0.4, u_contour));

    // Adjust edge for shapes
    if (u_shape >= 1.0 && u_shape < 2.0) {
      edge = 1.2 * edge;
    } else if (u_shape >= 2.0) {
      edge = 1.8 * pow(edge, 1.5);
    }
  }

  float diagBLtoTR = rotatedUV.x - rotatedUV.y;
  float diagTLtoBR = rotatedUV.x + rotatedUV.y;

  // Material-based color modifications
  float3 color1 = float3(u_colorLight);
  float3 color2 = float3(u_colorDark) + float3(0.0, 0.0, 0.1 * smoothstep(0.7, 1.3, diagTLtoBR));

  // Material modifications
  float materialContrast = 1.0;
  float materialSharpness = 1.0;
  float3 materialTint = float3(1.0);

  if (u_material > 0.5 && u_material < 1.5) {
    // chrome - high contrast, sharp reflections
    materialContrast = 1.4;
    materialSharpness = 1.5;
    color1 = mix(color1, float3(1.0), 0.3);
    color2 = mix(color2, float3(0.0), 0.3);
  } else if (u_material >= 1.5 && u_material < 2.5) {
    // brushed - add directional noise
    float brushNoise = snoise(workingUV * float2(50.0, 2.0)) * 0.1;
    color1 += brushNoise;
    color2 += brushNoise * 0.5;
    materialSharpness = 0.7;
  } else if (u_material >= 2.5 && u_material < 3.5) {
    // holographic - rainbow shift based on angle
    float hue = fract(diagBLtoTR * 0.5 + diagTLtoBR * 0.3 + t * 0.1);
    float3 rainbow = hsv2rgb(float3(hue, 0.6, 1.0));
    color1 = mix(color1, rainbow, 0.5);
    color2 = mix(color2, rainbow * 0.3, 0.4);
  } else if (u_material >= 3.5 && u_material < 4.5) {
    // pearl - soft iridescence
    float pearlShift = sin(diagBLtoTR * 3.0 + t * 0.5) * 0.1;
    color1.r += pearlShift;
    color1.b -= pearlShift;
    materialSharpness = 0.6;
    materialContrast = 0.8;
  } else if (u_material >= 4.5 && u_material < 5.5) {
    // glass - transparent feel
    color1 = mix(color1, float3(0.95, 0.97, 1.0), 0.5);
    color2 = mix(color2, float3(0.3, 0.35, 0.4), 0.5);
    materialContrast = 0.7;
  } else if (u_material >= 5.5) {
    // oil-slick - rainbow on dark
    float hue = fract(length(workingUV - 0.5) * 2.0 + diagBLtoTR * 0.5 + t * 0.15);
    float3 rainbow = hsv2rgb(float3(hue, 0.8, 0.9));
    color1 = mix(float3(0.1), rainbow, 0.7);
    color2 = float3(0.02, 0.02, 0.05);
  }

  float2 grad_uv = workingUV - 0.5;
  float dist = length(grad_uv + float2(0.0, 0.2 * diagBLtoTR));
  grad_uv = rotate(grad_uv, (0.25 - 0.2 * diagBLtoTR) * PI);
  float direction = grad_uv.x;

  // Pattern-based direction calculation
  if (u_pattern > 0.5 && u_pattern < 1.5) {
    // radial
    float2 center = workingUV - 0.5;
    direction = length(center) * 2.0;
  } else if (u_pattern >= 1.5 && u_pattern < 2.5) {
    // concentric
    float2 center = workingUV - 0.5;
    direction = length(center) * 4.0;
  } else if (u_pattern >= 2.5 && u_pattern < 3.5) {
    // diagonal-cross
    direction = abs(diagBLtoTR) + abs(diagTLtoBR - 1.0);
  } else if (u_pattern >= 3.5) {
    // noise
    direction = snoise(workingUV * 3.0 + t * 0.2) * 0.5 + 0.5;
  }

  // Ripple animation mode
  if (u_animationMode >= 2.5 && u_animationMode < 3.5) {
    float2 center = workingUV - 0.5;
    float ripple = sin(length(center) * 20.0 - u_time * 4.0) * 0.5 + 0.5;
    direction += ripple * 0.3;
  }

  float bump = pow(1.8 * dist, 1.2);
  bump = 1.0 - bump;
  bump *= pow(workingUV.y, 0.3);

  // Pulse animation affects bump
  if (u_animationMode >= 1.5 && u_animationMode < 2.5) {
    bump *= 0.8 + 0.2 * sin(u_time * 3.0);
  }

  float thin_strip_1_ratio = 0.12 / cycleWidth * (1.0 - 0.4 * bump);
  float thin_strip_2_ratio = 0.07 / cycleWidth * (1.0 + 0.4 * bump);
  float wide_strip_ratio = (1.0 - thin_strip_1_ratio - thin_strip_2_ratio);

  float thin_strip_1_width = cycleWidth * thin_strip_1_ratio;
  float thin_strip_2_width = cycleWidth * thin_strip_2_ratio;

  float noise = snoise(workingUV - t);

  // Shimmer adds extra noise
  if (u_animationMode >= 3.5 && u_animationMode < 4.5) {
    noise += snoise(workingUV * 10.0 + u_time * 5.0) * 0.3;
  }

  edge += (1.0 - edge) * u_distortion * noise;

  direction += diagBLtoTR;
  float contour = 0.0;
  direction -= 2.0 * noise * diagBLtoTR * (smoothstep(0.0, 1.0, edge) * (1.0 - smoothstep(0.0, 1.0, edge)));
  direction *= mix(1.0, 1.0 - edge, smoothstep(0.5, 1.0, u_contour));
  direction -= 1.7 * edge * smoothstep(0.5, 1.0, u_contour);
  direction += 0.2 * pow(u_contour, 4.0) * (1.0 - smoothstep(0.0, 1.0, edge));

  bump *= clamp(pow(workingUV.y, 0.1), 0.3, 1.0);
  direction *= (0.1 + (1.1 - edge) * bump);
  direction *= (0.4 + 0.6 * (1.0 - smoothstep(0.5, 1.0, edge)));
  direction += 0.18 * (smoothstep(0.1, 0.2, workingUV.y) * (1.0 - smoothstep(0.2, 0.4, workingUV.y)));
  direction += 0.03 * (smoothstep(0.1, 0.2, 1.0 - workingUV.y) * (1.0 - smoothstep(0.2, 0.4, 1.0 - workingUV.y)));
  direction *= (0.5 + 0.5 * pow(workingUV.y, 2.0));
  direction *= cycleWidth;

  // Only apply time-based movement for flow mode
  if (u_animationMode < 0.5) {
    direction -= t;
  }

  float colorDispersion = clamp(1.0 - bump, 0.0, 1.0);
  float dispersionRed = colorDispersion;
  dispersionRed += 0.03 * bump * noise;
  dispersionRed += 5.0 * (smoothstep(-0.1, 0.2, workingUV.y) * (1.0 - smoothstep(0.1, 0.5, workingUV.y))) * (smoothstep(0.4, 0.6, bump) * (1.0 - smoothstep(0.4, 1.0, bump)));
  dispersionRed -= diagBLtoTR;

  float dispersionBlue = colorDispersion * 1.3;
  dispersionBlue += (smoothstep(0.0, 0.4, workingUV.y) * (1.0 - smoothstep(0.1, 0.8, workingUV.y))) * (smoothstep(0.4, 0.6, bump) * (1.0 - smoothstep(0.4, 0.8, bump)));
  dispersionBlue -= 0.2 * edge;

  dispersionRed *= (u_shiftRed / 20.0);
  dispersionBlue *= (u_shiftBlue / 20.0);

  float blur = 0.0;
  float rExtraBlur = 0.0;
  float gExtraBlur = 0.0;

  if (u_isImage > 0.5) {
    float softness = 0.05 * u_softness;
    blur = softness + 0.5 * smoothstep(1.0, 10.0, u_repetition) * smoothstep(0.0, 1.0, edge);
    float smallCanvasT = 1.0 - smoothstep(100.0, 500.0, min(u_resolution.x, u_resolution.y));
    blur += smallCanvasT * smoothstep(0.0, 1.0, edge);
    rExtraBlur = softness * (0.05 + 0.1 * (u_shiftRed / 20.0) * bump);
    gExtraBlur = softness * 0.05 / max(0.001, abs(1.0 - diagBLtoTR));
  } else {
    blur = u_softness / 15.0 + 0.3 * contour;
  }

  // Apply material sharpness
  blur /= materialSharpness;

  float3 w = float3(thin_strip_1_width, thin_strip_2_width, wide_strip_ratio);
  w.y -= 0.02 * smoothstep(0.0, 1.0, edge + bump);

  float stripe_r = fract(direction + dispersionRed);
  float r = getColorChanges(color1.r, color2.r, stripe_r, w, blur + fw + rExtraBlur, bump, u_colorTint.r, u_colorTint, u_isImage);

  float stripe_g = fract(direction);
  float g = getColorChanges(color1.g, color2.g, stripe_g, w, blur + fw + gExtraBlur, bump, u_colorTint.g, u_colorTint, u_isImage);

  float stripe_b = fract(direction - dispersionBlue);
  float b = getColorChanges(color1.b, color2.b, stripe_b, w, blur + fw, bump, u_colorTint.b, u_colorTint, u_isImage);

  float3 color = float3(r, g, b);

  // Apply material contrast
  color = mix(float3(0.5), color, materialContrast);
  color = clamp(color, 0.0, 1.0);

  color *= opacity;

  float3 bgColor = u_colorBack.rgb * u_colorBack.a;
  color = color + bgColor * (1.0 - opacity);
  opacity = opacity + u_colorBack.a * (1.0 - opacity);

  // Color banding fix
  float randVal = fract(sin(dot(0.014 * coord, float2(12.9898, 78.233))) * 43758.5453123);
  color += 1.0 / 256.0 * (randVal - 0.5);

  return half4(half3(color), half(opacity));
}
`;

export const LiquidMetalShapes = {
	none: 0,
	circle: 1,
	daisy: 2,
	diamond: 3,
	metaballs: 4,
	heart: 5,
	star: 6,
	hexagon: 7,
	pill: 8,
	wave: 9,
	blob: 10
} as const;

export type LiquidMetalShape = keyof typeof LiquidMetalShapes;

export const LiquidMetalAnimationModes = {
	flow: 0,
	still: 1,
	pulse: 2,
	ripple: 3,
	shimmer: 4,
	rotate: 5
} as const;

export type LiquidMetalAnimationMode = keyof typeof LiquidMetalAnimationModes;

export const LiquidMetalPatterns = {
	linear: 0,
	radial: 1,
	concentric: 2,
	'diagonal-cross': 3,
	noise: 4
} as const;

export type LiquidMetalPattern = keyof typeof LiquidMetalPatterns;

export const LiquidMetalMaterials = {
	default: 0,
	chrome: 1,
	brushed: 2,
	holographic: 3,
	pearl: 4,
	glass: 5,
	'oil-slick': 6
} as const;

export type LiquidMetalMaterial = keyof typeof LiquidMetalMaterials;
