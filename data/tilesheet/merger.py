from PIL import Image

def add_transparent_bottom_tile(input_image_path, output_image_path, tile_height=32, opacity=128):
    # Open the original image
    img = Image.open(input_image_path)
    
    # Convert to RGBA if it isn't already
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    # Get the original dimensions
    width, height = img.size
    
    # Create a new image with extended height
    new_height = height + tile_height
    new_img = Image.new('RGBA', (width, new_height), (0, 0, 0, 0))
    
    # Paste the original image at the top
    new_img.paste(img, (0, 0))
    
    # Create a transparent tile
    tile = Image.new('RGBA', (width, tile_height), (0, 0, 0, opacity))
    
    # Paste the transparent tile at the bottom
    new_img.paste(tile, (0, height), mask=tile)
    
    # Save the result
    new_img.save(output_image_path, 'PNG')

add_transparent_bottom_tile('town.png', 'towntilesheet.png', tile_height=32, opacity=0)