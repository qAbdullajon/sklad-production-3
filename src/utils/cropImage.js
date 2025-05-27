export const getCroppedImg = (imageSrc, pixelCrop) => {
    const image = new Image();
    image.src = imageSrc;
  
    return new Promise((resolve) => {
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;
        const ctx = canvas.getContext('2d');
  
        ctx.drawImage(
          image,
          pixelCrop.x,
          pixelCrop.y,
          pixelCrop.width,
          pixelCrop.height,
          0,
          0,
          pixelCrop.width,
          pixelCrop.height
        );
  
        canvas.toBlob((blob) => {
          const fileUrl = URL.createObjectURL(blob);
          resolve(fileUrl);
        }, 'image/jpeg');
      };
    });
  };
  