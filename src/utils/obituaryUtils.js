// --- CÁLCULOS DO OBITUÁRIO (Estatísticas de Fumante) ---

/**
 * Calcula estatísticas do "obituário" do fumante
 * @param {number} cigarettesCount - Total de cigarros fumados
 * @returns {Object} Estatísticas formatadas
 */
export const calculateObituaryStats = (cigarettesCount) => {
  const cigs = cigarettesCount || 0;
  
  // Dinheiro desperdiçado (média R$ 1,00 por cigarro)
  const moneyWasted = (cigs * 1.00).toFixed(2);
  
  // Vida perdida (11 minutos por cigarro segundo estudos)
  const lifeLostMinutes = cigs * 11;
  const lifeLostHours = (lifeLostMinutes / 60).toFixed(1);
  const lifeLostDays = (lifeLostMinutes / (60 * 24)).toFixed(2);
  
  // "Torre de cigarros" empilhados (8cm por cigarro)
  const metersSmoked = ((cigs * 8) / 100).toFixed(1);
  
  // Alcatrão inalado (aprox 10mg por cigarro)
  const tarInhaled = ((cigs * 10) / 1000).toFixed(2); // em gramas
  
  return {
    cigarettes: cigs,
    moneyWasted,
    lifeLostMinutes,
    lifeLostHours,
    lifeLostDays,
    metersSmoked,
    tarInhaled
  };
};

/**
 * Retorna mensagem motivacional baseada no progresso
 * @param {number} cigarettesCount
 * @returns {string}
 */
export const getObituaryMessage = (cigarettesCount) => {
  if (cigarettesCount < 10) return "Ainda dá tempo de parar... ou não.";
  if (cigarettesCount < 50) return "Seus pulmões já conhecem você.";
  if (cigarettesCount < 200) return "O médico vai adorar te conhecer.";
  if (cigarettesCount < 500) return "Você é oficialmente um chaminé.";
  return "Lenda viva (por enquanto).";
};