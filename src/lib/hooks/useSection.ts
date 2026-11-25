import { useCallback, useEffect, useState } from 'react';

export type Section = 'today' | 'review';

const SECTIONS: Section[] = ['today', 'review'];

function readSection(): Section {
  const hash = window.location.hash.replace('#', '');
  return (SECTIONS as string[]).includes(hash) ? (hash as Section) : 'today';
}

/** Which section is showing, kept in the URL hash so refresh and back work. */
export function useSection() {
  const [section, setSectionState] = useState<Section>(readSection);

  useEffect(() => {
    const onHashChange = () => setSectionState(readSection());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const setSection = useCallback((next: Section) => {
    window.location.hash = next;
    window.scrollTo(0, 0);
  }, []);

  return { section, setSection };
}