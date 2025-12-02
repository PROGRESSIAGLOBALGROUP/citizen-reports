/**
 * Hook de Accesibilidad WCAG 2.1
 * Proporciona utilidades para mejorar la accesibilidad de la aplicación
 */
import { useEffect, useCallback, useRef } from 'react';

/**
 * Anuncia un mensaje al lector de pantalla
 * @param {string} message - Mensaje a anunciar
 * @param {'polite'|'assertive'} priority - Prioridad del anuncio
 */
export function announceToScreenReader(message, priority = 'polite') {
  // Buscar o crear el contenedor de anuncios
  let announcer = document.getElementById('sr-announcer');
  
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = 'sr-announcer';
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    document.body.appendChild(announcer);
  }
  
  // Actualizar prioridad si es diferente
  announcer.setAttribute('aria-live', priority);
  
  // Limpiar y establecer mensaje (necesario para que se anuncie de nuevo)
  announcer.textContent = '';
  requestAnimationFrame(() => {
    announcer.textContent = message;
  });
}

/**
 * Hook para gestionar focus traps en modales/dialogs
 * @param {boolean} isActive - Si el focus trap está activo
 * @param {React.RefObject} containerRef - Ref del contenedor
 */
export function useFocusTrap(isActive, containerRef) {
  const previousActiveElement = useRef(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Guardar elemento activo anterior
    previousActiveElement.current = document.activeElement;

    // Obtener elementos focuseables
    const focusableElements = containerRef.current.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Enfocar el primer elemento
    if (firstElement) {
      firstElement.focus();
    }

    // Manejador de Tab
    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restaurar focus anterior
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive, containerRef]);
}

/**
 * Hook para cerrar modales con Escape
 * @param {boolean} isOpen - Si el modal está abierto
 * @param {Function} onClose - Callback para cerrar
 */
export function useEscapeKey(isOpen, onClose) {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
}

/**
 * Hook para skip links (saltar al contenido principal)
 */
export function useSkipLinks() {
  useEffect(() => {
    // Verificar si ya existe
    if (document.getElementById('skip-link')) return;

    const skipLink = document.createElement('a');
    skipLink.id = 'skip-link';
    skipLink.href = '#main-content';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Saltar al contenido principal';
    
    // Insertar al principio del body
    document.body.insertBefore(skipLink, document.body.firstChild);

    return () => {
      skipLink.remove();
    };
  }, []);
}

/**
 * Hook para reducir movimiento si el usuario lo prefiere
 * @returns {boolean} - Si se debe reducir el movimiento
 */
export function useReducedMotion() {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mediaQuery.matches;
}

/**
 * Hook para modo de alto contraste
 * @returns {boolean} - Si está en modo alto contraste
 */
export function useHighContrast() {
  const mediaQuery = window.matchMedia('(prefers-contrast: more)');
  return mediaQuery.matches;
}

/**
 * Genera un ID único para asociar labels con inputs
 * @param {string} prefix - Prefijo del ID
 * @returns {string} - ID único
 */
export function generateId(prefix = 'a11y') {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Props comunes para botones de iconos (accesibilidad)
 * @param {string} label - Etiqueta descriptiva
 * @returns {Object} - Props de accesibilidad
 */
export function iconButtonProps(label) {
  return {
    'aria-label': label,
    'title': label,
    'role': 'button',
    'tabIndex': 0,
  };
}

/**
 * Props para elementos que actúan como botones pero no son <button>
 * @param {Function} onClick - Handler de click
 * @param {string} label - Etiqueta descriptiva
 */
export function useButtonBehavior(onClick, label) {
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(e);
    }
  }, [onClick]);

  return {
    onClick,
    onKeyDown: handleKeyDown,
    role: 'button',
    tabIndex: 0,
    'aria-label': label,
  };
}

export default {
  announceToScreenReader,
  useFocusTrap,
  useEscapeKey,
  useSkipLinks,
  useReducedMotion,
  useHighContrast,
  generateId,
  iconButtonProps,
  useButtonBehavior,
};
