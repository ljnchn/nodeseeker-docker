#!/usr/bin/env python3
"""
从 favicon.svg 生成 PNG 图标
基于 emoji 📡 生成各种尺寸的 PWA 图标

使用方法:
    python scripts/generate-favicon-png.py
"""

import os
import io
import base64

# 图标尺寸配置
ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

def create_svg_with_size(size):
    """创建指定尺寸的 SVG"""
    font_size = int(size * 0.75)  # emoji 占 75%
    y_offset = int(size * 0.85)   # 垂直偏移
    
    svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" width="{size}" height="{size}">
  <rect width="{size}" height="{size}" fill="#0f172a" rx="{int(size*0.2)}" ry="{int(size*0.2)}"/>
  <text x="50%" y="{y_offset}" font-size="{font_size}" text-anchor="middle" dominant-baseline="middle">📡</text>
</svg>'''
    return svg

def svg_to_png_pillow(svg_content, size):
    """使用 Pillow 将 SVG 转为 PNG (如果 cairosvg 不可用)"""
    try:
        from PIL import Image, ImageDraw, ImageFont
        
        # 创建背景
        img = Image.new('RGBA', (size, size), (15, 23, 42, 255))  # #0f172a
        draw = ImageDraw.Draw(img)
        
        # 尝试使用系统字体渲染 emoji
        font_size = int(size * 0.6)
        
        # 尝试不同的字体
        font = None
        font_options = [
            # Windows
            "Segoe UI Emoji",
            "Segoe UI Symbol",
            # macOS
            "Apple Color Emoji",
            # Linux
            "Noto Color Emoji",
            "Noto Sans CJK SC",
            "DejaVu Sans",
            # 通用
            "Arial Unicode MS",
            "Arial",
        ]
        
        for font_name in font_options:
            try:
                font = ImageFont.truetype(font_name, font_size)
                break
            except:
                continue
        
        if font is None:
            # 使用默认字体
            font = ImageFont.load_default()
        
        # 绘制圆角矩形背景
        padding = int(size * 0.1)
        draw.rounded_rectangle(
            [padding, padding, size - padding, size - padding],
            radius=int(size * 0.15),
            fill=(30, 41, 59, 255),  # #1e293b
            outline=(51, 65, 85, 255),  # #334155
            width=max(1, int(size * 0.02))
        )
        
        # 绘制 emoji
        text = "📡"
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        x = (size - text_width) // 2
        y = (size - text_height) // 2 - int(size * 0.05)
        
        draw.text((x, y), text, font=font, embedded_color=True)
        
        return img
        
    except ImportError:
        return None
    except Exception as e:
        print(f"Pillow error: {e}")
        return None

def svg_to_png_cairosvg(svg_content, size, output_path):
    """使用 cairosvg 转换"""
    try:
        import cairosvg
        cairosvg.svg2png(
            bytestring=svg_content.encode('utf-8'),
            write_to=output_path,
            output_width=size,
            output_height=size,
            background_color="#0f172a"
        )
        return True
    except ImportError:
        return False
    except Exception as e:
        print(f"CairoSVG error: {e}")
        return False

def create_fallback_icon(size, output_path):
    """创建简单的 fallback 图标（如果其他方法都失败）"""
    try:
        from PIL import Image, ImageDraw
        
        # 创建图片
        img = Image.new('RGBA', (size, size), (15, 23, 42, 255))
        draw = ImageDraw.Draw(img)
        
        # 绘制圆角矩形背景
        padding = int(size * 0.08)
        draw.rounded_rectangle(
            [padding, padding, size - padding, size - padding],
            radius=int(size * 0.15),
            fill=(30, 41, 59, 255),
            outline=(59, 130, 246, 255),  # 蓝色边框 #3b82f6
            width=max(2, int(size * 0.03))
        )
        
        # 绘制一个简单的信号塔形状
        center_x = size // 2
        center_y = size // 2
        
        # 塔身（使用蓝色）
        tower_color = (59, 130, 246, 255)  # #3b82f6
        
        # 底部三角形
        triangle_size = int(size * 0.15)
        draw.polygon([
            (center_x, center_y + triangle_size),
            (center_x - triangle_size//2, center_y + triangle_size + triangle_size//2),
            (center_x + triangle_size//2, center_y + triangle_size + triangle_size//2),
        ], fill=tower_color)
        
        # 塔身线条
        line_width = max(2, int(size * 0.03))
        draw.line([
            (center_x, center_y + triangle_size),
            (center_x, center_y - triangle_size)
        ], fill=tower_color, width=line_width)
        
        # 天线
        draw.line([
            (center_x, center_y - triangle_size),
            (center_x, center_y - int(size * 0.25))
        ], fill=(148, 163, 184, 255), width=max(1, line_width - 1))
        
        # 顶部圆点
        dot_radius = max(3, int(size * 0.04))
        draw.ellipse([
            (center_x - dot_radius, center_y - int(size * 0.25) - dot_radius),
            (center_x + dot_radius, center_y - int(size * 0.25) + dot_radius)
        ], fill=tower_color)
        
        # 右侧信号波纹
        arc_color = (96, 165, 250, 200)  # 浅蓝色
        for i in range(3):
            radius = int(size * 0.15) + i * int(size * 0.06)
            draw.arc([
                (center_x, center_y - int(size * 0.1)),
                (center_x + radius, center_y - int(size * 0.1) + radius)
            ], start=270, end=360, fill=arc_color, width=max(1, int(size * 0.015)))
        
        # 左侧信号波纹
        for i in range(3):
            radius = int(size * 0.15) + i * int(size * 0.06)
            draw.arc([
                (center_x - radius, center_y - int(size * 0.1)),
                (center_x, center_y - int(size * 0.1) + radius)
            ], start=180, end=270, fill=arc_color, width=max(1, int(size * 0.015)))
        
        # 状态指示点
        status_radius = max(3, int(size * 0.035))
        draw.ellipse([
            (center_x - status_radius, center_y + int(size * 0.05) - status_radius),
            (center_x + status_radius, center_y + int(size * 0.05) + status_radius)
        ], fill=(16, 185, 129, 255))  # 绿色 #10b981
        
        img.save(output_path, 'PNG')
        return True
        
    except ImportError:
        return False
    except Exception as e:
        print(f"Fallback error: {e}")
        return False

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    icons_dir = os.path.join(script_dir, '..', 'public', 'icons')
    
    # 确保目录存在
    os.makedirs(icons_dir, exist_ok=True)
    
    print("Generating PNG icons from favicon.svg...\n")
    
    # 读取原始 favicon.svg
    favicon_path = os.path.join(script_dir, '..', 'public', 'favicon.svg')
    if os.path.exists(favicon_path):
        with open(favicon_path, 'r', encoding='utf-8') as f:
            original_svg = f.read()
        print(f"[OK] Loaded: {favicon_path}")
    else:
        print(f"[WARN] favicon.svg not found, using default emoji")
        original_svg = None
    
    # 检查可用的库
    has_cairosvg = False
    has_pillow = False
    
    try:
        import cairosvg
        has_cairosvg = True
        print("[OK] Using: CairoSVG")
    except ImportError:
        pass
    
    try:
        from PIL import Image
        has_pillow = True
        if not has_cairosvg:
            print("[OK] Using: Pillow")
    except ImportError:
        pass
    
    if not has_cairosvg and not has_pillow:
        print("[ERROR] No image library found. Install one of:")
        print("        pip install cairosvg")
        print("        pip install Pillow")
        return
    
    # 生成各种尺寸的图标
    for size in ICON_SIZES:
        output_path = os.path.join(icons_dir, f"icon-{size}x{size}.png")
        
        # 创建该尺寸的 SVG
        svg_content = create_svg_with_size(size)
        
        success = False
        
        # 尝试 CairoSVG
        if has_cairosvg:
            success = svg_to_png_cairosvg(svg_content, size, output_path)
        
        # 尝试 Pillow
        if not success and has_pillow:
            img = svg_to_png_pillow(svg_content, size)
            if img:
                img.save(output_path, 'PNG')
                success = True
        
        # 使用 fallback
        if not success:
            success = create_fallback_icon(size, output_path)
        
        if success:
            print(f"[OK] Generated: icon-{size}x{size}.png")
        else:
            print(f"[FAIL] Failed: icon-{size}x{size}.png")
    
    # 生成 maskable 图标（更大边距）
    print("\nGenerating maskable icon...")
    try:
        from PIL import Image, ImageDraw
        
        size = 512
        output_path = os.path.join(icons_dir, "maskable-icon.png")
        
        img = Image.new('RGBA', (size, size), (15, 23, 42, 255))
        draw = ImageDraw.Draw(img)
        
        # 纯色背景，无圆角（maskable 图标由系统自动裁剪）
        draw.rectangle([0, 0, size, size], fill=(15, 23, 42, 255))
        
        # 绘制更小的图标（留出安全边距）
        padding = int(size * 0.15)  # 15% 边距
        inner_size = size - 2 * padding
        
        # 绘制 fallback 图标在中心
        center_x = size // 2
        center_y = size // 2
        
        tower_color = (59, 130, 246, 255)
        
        # 塔身
        triangle_size = int(inner_size * 0.12)
        draw.polygon([
            (center_x, center_y + triangle_size),
            (center_x - triangle_size//2, center_y + triangle_size + triangle_size//2),
            (center_x + triangle_size//2, center_y + triangle_size + triangle_size//2),
        ], fill=tower_color)
        
        line_width = max(3, int(inner_size * 0.025))
        draw.line([
            (center_x, center_y + triangle_size),
            (center_x, center_y - triangle_size)
        ], fill=tower_color, width=line_width)
        
        draw.line([
            (center_x, center_y - triangle_size),
            (center_x, center_y - int(inner_size * 0.2))
        ], fill=(148, 163, 184, 255), width=max(2, line_width - 1))
        
        dot_radius = max(4, int(inner_size * 0.035))
        draw.ellipse([
            (center_x - dot_radius, center_y - int(inner_size * 0.2) - dot_radius),
            (center_x + dot_radius, center_y - int(inner_size * 0.2) + dot_radius)
        ], fill=tower_color)
        
        # 信号波纹
        arc_color = (96, 165, 250, 200)
        for i in range(3):
            radius = int(inner_size * 0.12) + i * int(inner_size * 0.05)
            draw.arc([
                (center_x, center_y - int(inner_size * 0.08)),
                (center_x + radius, center_y - int(inner_size * 0.08) + radius)
            ], start=270, end=360, fill=arc_color, width=max(2, int(inner_size * 0.012)))
            draw.arc([
                (center_x - radius, center_y - int(inner_size * 0.08)),
                (center_x, center_y - int(inner_size * 0.08) + radius)
            ], start=180, end=270, fill=arc_color, width=max(2, int(inner_size * 0.012)))
        
        # 状态点
        status_radius = max(4, int(inner_size * 0.03))
        draw.ellipse([
            (center_x - status_radius, center_y + int(inner_size * 0.04) - status_radius),
            (center_x + status_radius, center_y + int(inner_size * 0.04) + status_radius)
        ], fill=(16, 185, 129, 255))
        
        img.save(output_path, 'PNG')
        print(f"[OK] Generated: maskable-icon.png")
        
    except Exception as e:
        print(f"[FAIL] Failed: maskable-icon.png - {e}")
    
    print("\n" + "=" * 50)
    print("Done! Icons generated from favicon.svg")
    print(f"Location: {icons_dir}")

if __name__ == "__main__":
    main()
