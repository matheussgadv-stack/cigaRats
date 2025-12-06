// --- UTILITÁRIOS DE IMAGEM ---

/**
 * Comprime uma imagem para reduzir tamanho antes de salvar
 * @param {File} file - Arquivo de imagem original
 * @param {number} maxWidth - Largura máxima (padrão: 600px)
 * @param {number} quality - Qualidade JPEG (0-1, padrão: 0.6)
 * @returns {Promise<string>} Base64 da imagem comprimida
 */
export const compressImage = (file, maxWidth = 600, quality = 0.6) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scaleSize = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scaleSize;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
    };
  });
};

/**
 * Avatares pré-definidos usando DiceBear API
 */
export const PRESET_AVATARS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/bottts/svg?seed=CigarBot",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Smoke",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Captain",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Witch",
];

/**
 * Gera avatar padrão baseado em seed
 * @param {string} seed - String para gerar avatar único
 * @returns {string} URL do avatar
 */
export const generateDefaultAvatar = (seed) => {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4`;
};