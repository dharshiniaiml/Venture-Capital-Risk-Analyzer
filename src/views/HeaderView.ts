import { store, TabId } from '../framework/store';

export function renderHeader(): HTMLElement {
  const state = store.getState();
  const header = document.createElement('header');
  header.className = 'w-full bg-[#0c1220] border-b border-slate-800/80 sticky top-0 z-40 backdrop-blur-md bg-opacity-95';

  const container = document.createElement('div');
  container.className = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8';

  // Zone 1: Brand title wordmark (1 line, single element)
  const brand = document.createElement('div');
  brand.className = 'flex items-center gap-3 shrink-0 cursor-pointer select-none';
  brand.onclick = () => store.setActiveTab('pipeline');
  brand.innerHTML = `
    <div class="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center font-bold text-white text-xs tracking-wider shadow-sm">
      CBT
    </div>
    <span class="text-base font-bold tracking-tight text-slate-100 whitespace-nowrap">
      VentureCBT Intelligence
    </span>
  `;

  // Zone 2: 4-5 clean single-line nav links with hover states
  const nav = document.createElement('nav');
  nav.className = 'hidden md:flex items-center gap-7 text-sm font-medium';

  const navItems: Array<{ id: TabId; label: string }> = [
    { id: 'pipeline', label: 'Pipeline' },
    { id: 'audit', label: 'CBT Diagnostics' },
    { id: 'simulator', label: 'Stress Simulator' },
    { id: 'diligence', label: 'AI Partner Memo' },
    { id: 'matrix', label: 'Cohort Frontier' },
  ];

  navItems.forEach((item) => {
    const btn = document.createElement('button');
    const isActive = state.activeTab === item.id;
    btn.className = `whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 font-medium ${
      isActive
        ? 'text-sky-400 border-sky-400 font-semibold'
        : 'text-slate-400 hover:text-slate-200 border-transparent'
    }`;
    btn.textContent = item.label;
    btn.onclick = () => store.setActiveTab(item.id);
    nav.appendChild(btn);
  });

  // Zone 3: 1 primary action button
  const actionZone = document.createElement('div');
  actionZone.className = 'flex items-center gap-3 shrink-0';

  const newStartupBtn = document.createElement('button');
  newStartupBtn.className =
    'px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-md transition-colors whitespace-nowrap shrink-0 shadow-sm cursor-pointer';
  newStartupBtn.textContent = '+ New Deal Diligence';
  newStartupBtn.onclick = () => store.setIntakeModalOpen(true);

  actionZone.appendChild(newStartupBtn);

  container.appendChild(brand);
  container.appendChild(nav);
  container.appendChild(actionZone);
  header.appendChild(container);

  return header;
}
