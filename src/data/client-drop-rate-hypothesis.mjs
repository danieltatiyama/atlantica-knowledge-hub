/**
 * A display-only historical client source-rate hypothesis.
 *
 * Earlier Miner exploration identified a candidate fixed-point rate
 * scale of 0..10000. On that SCALE 10000 represents 100%, so raw/100
 * gives a readable PERCENT. We have NOT verified this is a real drop
 * probability on the current live server.
 *
 * - Show direct/character-group/group-item stages INDEPENDENTLY.
 * - Never multiply stages: server roll semantics and band selection
 *   are unknown. GroupBands.RawSum is a sum, NOT a probability.
 * - Keep the exact RawRate in all source tables.
 * - Do not emit a guessed percentage for missing/invalid input.
 */
export const CLIENT_RATE_HYPOTHESIS_DENOMINATOR=10000;
const RAW_INTEGER=/^(?:0|[1-9][0-9]{0,4})$/;

export function candidateClientRatePercent(raw){
  if(typeof raw!=="string"&&typeof raw!=="number")return null;
  const value=String(raw);
  if(!RAW_INTEGER.test(value))return null;
  const n=Number(value);
  if(!Number.isSafeInteger(n)||n<0||n>CLIENT_RATE_HYPOTHESIS_DENOMINATOR)
    return null;
  return n/100;
}

export function formatCandidateClientRate(raw,lang="en"){
  const value=candidateClientRatePercent(raw);
  if(value===null)return "—";
  return new Intl.NumberFormat(lang==="pt-br"?"pt-BR":"en-US",{
    minimumFractionDigits:0,maximumFractionDigits:2,
  }).format(value)+"%";
}
