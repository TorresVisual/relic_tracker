from PIL import Image
import os

def generate_icons(input_path, output_dir):
    # Create output directory if it doesn't exist
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # Open the source image
    img = Image.open(input_path)

    # Define icon sizes
    sizes = [
        (72, 72),
        (96, 96),
        (128, 128),
        (144, 144),
        (152, 152),
        (167, 167),
        (180, 180),
        (192, 192),
        (384, 384),
        (512, 512)
    ]

    # Generate icons for each size
    for size in sizes:
        output_name = f"icon-{size[0]}x{size[1]}.png"
        output_path = os.path.join(output_dir, output_name)
        
        # Create a copy of the image and resize it
        resized = img.copy()
        resized.thumbnail(size, Image.Resampling.LANCZOS)
        
        # If the image is not square, create a square canvas
        if resized.width != resized.height:
            square = Image.new('RGBA', size, (0, 0, 0, 0))
            # Calculate position to paste the image in the center
            paste_pos = ((size[0] - resized.width) // 2,
                        (size[1] - resized.height) // 2)
            square.paste(resized, paste_pos)
            resized = square
        
        # Save the resized image
        resized.save(output_path, 'PNG', quality=95)
        print(f"Generated {output_name}")

if __name__ == "__main__":
    input_path = "./src/img/relic_tracker.png"
    output_dir = "./src/img"
    generate_icons(input_path, output_dir)
    print("Icon generation complete!") 