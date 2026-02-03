import { useEffect, useRef } from 'react';

/**
 * Hook para detetar leitura de código de barras (Leitor USB HID).
 * 
 * Funciona intercetando eventos de teclado globais. Se detetar uma sequência rápida
 * de caracteres terminada em 'Enter', assume que é um código de barras.
 * 
 * @param onScan Função chamada com o código lido
 * @param options Opções de configuração
 */
export const useBarcodeScanner = (
    onScan: (code: string) => void,
    options: { minLength?: number } = {}
) => {
    const buffer = useRef<string>('');
    const lastKeyTime = useRef<number>(0);
    const { minLength = 3 } = options;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignorar se o foco estiver num campo de texto (input/textarea)
            // para evitar conflitos com digitação normal ou preenchimento de formulários.
            // O leitor de código de barras funcionará como um teclado normal nesses casos.
            const target = e.target as HTMLElement;
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
                return;
            }

            const now = Date.now();

            // Se o intervalo entre teclas for grande (> 100ms), assumimos que é digitação manual
            // ou início de uma nova leitura, por isso limpamos o buffer antigo.
            if (now - lastKeyTime.current > 100) {
                buffer.current = '';
            }

            lastKeyTime.current = now;

            if (e.key === 'Enter') {
                // Ao carregar Enter, se tivermos caracteres suficientes no buffer, disparamos o scan
                if (buffer.current.length >= minLength) {
                    // Prevenir comportamento padrão (opcional, ex: submeter forms ocultos)
                    e.preventDefault();
                    onScan(buffer.current);
                    buffer.current = ''; // Limpar após sucesso
                }
            } else if (e.key.length === 1) {
                // Acumular caracteres imprimíveis
                buffer.current += e.key;
            }
            // Ignorar teclas especiais (Shift, Ctrl, etc.)
        };

        // Adicionar listener global
        window.addEventListener('keydown', handleKeyDown);

        // Cleanup ao desmontar
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onScan, minLength]);
};
