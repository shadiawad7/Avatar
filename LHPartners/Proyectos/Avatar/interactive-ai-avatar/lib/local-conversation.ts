type PersonalityId = 'alegra' | 'empatico' | 'intenso'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

const ES_CLASS = /\b(ingles|espanol|gramatica|pronunciacion|conversacion|examen|clase)\b/i
const ES_BIZ = /\b(ingresos|ventas|mercado|precio|clientes|startup|estrategia|margen)\b/i
const ES_GAME = /\b(juego|adivinanza|cuento|reto|jugar)\b/i

function cleanTopic(text: string): string {
  return text
    .replace(/[?¿!¡.,;:()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60)
}

function alegraReply(userText: string): string {
  const topic = cleanTopic(userText)

  if (ES_BIZ.test(userText) || ES_CLASS.test(userText)) {
    return 'Eso suena interesante, pero aqui hacemos juegos y actividades divertidas. Prefieres una adivinanza rapida o un mini juego de memoria?'
  }
  if (ES_GAME.test(userText)) {
    return `Genial, jugamos con tu idea: "${topic}". Prefieres una adivinanza o un reto creativo?`
  }
  return `Vale, te he entendido: "${topic}". Quieres un juego rapido, una adivinanza o un reto creativo?`
}

function empaticoReply(userText: string, messages: Message[]): string {
  const assistantTurns = messages.filter(m => m.role === 'assistant').length
  const topic = cleanTopic(userText)

  if (assistantTurns === 0) {
    return 'Hola, soy tu profesor de espanol e ingles. Que tipo de clase quieres hoy: conversacion, gramatica, pronunciacion o preparacion de examen?'
  }

  if (ES_CLASS.test(userText)) {
    return `Perfecto, trabajamos "${topic}". Que nivel tienes ahora, basico, intermedio o avanzado?`
  }
  return `Entendido: "${topic}". Prefieres practicar primero en espanol o en ingles?`
}

function intensoReply(userText: string): string {
  const topic = cleanTopic(userText)

  if (ES_BIZ.test(userText)) {
    return `Claro. Sobre "${topic}", vamos a fijarlo con numeros. Cual es tu cliente objetivo, ingreso mensual y tasa de conversion actual?`
  }
  return `Entendido: "${topic}". Para darte consejo util, que mercado atacas y que metrica quieres mejorar primero?`
}

export function generateLocalAssistantReply(
  personalityId: string,
  userText: string,
  messages: Message[]
): string {
  const persona = (personalityId === 'empatico' || personalityId === 'intenso'
    ? personalityId
    : 'alegra') as PersonalityId

  if (!userText.trim()) {
    return 'Te escucho. Dime que quieres trabajar.'
  }

  if (persona === 'alegra') return alegraReply(userText)
  if (persona === 'empatico') return empaticoReply(userText, messages)
  return intensoReply(userText)
}
