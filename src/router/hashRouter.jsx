/**
 * NavLink component — hash anchor with active-class support.
 * Kept in its own file (components only) to satisfy react-refresh rules.
 */
import { navigate } from './routerUtils';

export function NavLink({ to, children, className, activeClass, currentPath }) {
  const isActive =
    currentPath === to ||
    (to === '/dashboard' &&
      (currentPath === '/' || currentPath === '/dashboard'));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(to);
    }
  };

  return (
    <a
      href={`#${to}`}
      className={`${className || ''} ${isActive && activeClass ? activeClass : ''}`.trim()}
      aria-current={isActive ? 'page' : undefined}
      onKeyDown={handleKeyDown}
    >
      {children}
    </a>
  );
}
