import CryptoJS from 'crypto-js'

/**
 * Encripta un objeto JSON usando AES con una passphrase
 * @param jsonObject - El objeto a encriptar
 * @param passphrase - La clave de encriptación (no se guarda en ningún lado)
 * @returns String encriptado en formato base64
 */
export function encryptData(jsonObject: any, passphrase: string): string {
  try {
    // Convertir el objeto a string JSON
    const jsonString = JSON.stringify(jsonObject)
    
    // Encriptar usando AES
    const encrypted = CryptoJS.AES.encrypt(jsonString, passphrase).toString()
    
    return encrypted
  } catch (error) {
    console.error('Error al encriptar datos:', error)
    throw new Error('No se pudo encriptar los datos. Verifica que el objeto sea válido.')
  }
}

/**
 * Desencripta un string encriptado y lo convierte de vuelta a objeto JSON
 * @param encryptedString - El string encriptado
 * @param passphrase - La clave de encriptación (debe ser la misma usada para encriptar)
 * @returns El objeto JSON original
 * @throws Error si la passphrase es incorrecta o los datos están corruptos
 */
export function decryptData(encryptedString: string, passphrase: string): any {
  try {
    // Desencriptar usando AES
    const decrypted = CryptoJS.AES.decrypt(encryptedString, passphrase)
    
    // Convertir a string
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8)
    
    // Verificar que la desencriptación fue exitosa
    if (!decryptedString) {
      throw new Error('Contraseña incorrecta o datos corruptos')
    }
    
    // Parsear el JSON
    const jsonObject = JSON.parse(decryptedString)
    
    return jsonObject
  } catch (error) {
    if (error instanceof Error && error.message.includes('Contraseña incorrecta')) {
      throw error
    }
    console.error('Error al desencriptar datos:', error)
    throw new Error('No se pudo desencriptar los datos. Verifica que la contraseña sea correcta.')
  }
}
