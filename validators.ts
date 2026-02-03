// Algoritmo oficial de validação de NIF Português
export const isValidNIF = (nif: string): boolean => {
  if (!['1', '2', '3', '5', '6', '8', '9'].includes(nif.substr(0, 1)) &&
      !['45', '70', '71', '72', '77', '79', '90', '91', '98', '99'].includes(nif.substr(0, 2))) {
    return false;
  }
  
  const total = nif[0] * 9 + nif[1] * 8 + nif[2] * 7 + nif[3] * 6 + nif[4] * 5 + nif[5] * 4 + nif[6] * 3 + nif[7] * 2;
  const modulo11 = total - Math.floor(total / 11) * 11;
  let comparador = modulo11 === 1 || modulo11 === 0 ? 0 : 11 - modulo11;
  
  return nif[8] == comparador;
};

export const validateProductPrice = (price: number, costPrice: number) => {
  if (costPrice > price) {
    return { isValid: true, warning: 'Atenção: Margem negativa (Preço de venda inferior ao custo).' };
  }
  const margin = ((price - costPrice) / price) * 100;
  if (margin < 10) {
    return { isValid: true, warning: `Atenção: Margem baixa (${margin.toFixed(1)}%).` };
  }
  return { isValid: true, warning: null };
};