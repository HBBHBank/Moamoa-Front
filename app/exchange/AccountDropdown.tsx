import { useState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";

type Account = {
  accountNumber: string;
  currencyCode: string;
};

type Props = {
  accounts: Account[];
  value: string;
  onChange: (val: string) => void;
  currencyMeta: Record<string, { name: string; flag: string; symbol: string }>;
  onAddAccount?: () => void;
};

export default function AccountDropdown({ accounts, value, onChange, currencyMeta, onlyCode, onAddAccount }: Props & { onlyCode?: boolean, onAddAccount?: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = accounts.find(acc => acc.accountNumber === value);
  const formatAccountNumber = (num: string) => num.replace(/-/g, "");

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        className={`flex items-center w-full bg-white border border-gray-300 rounded-lg py-2 pl-4 pr-10 text-lg font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4DA9FF] focus:border-[#4DA9FF] cursor-pointer transition ${open ? "ring-2 ring-[#4DA9FF]" : ""}`}
        onClick={() => setOpen(v => !v)}
      >
        {accounts.length === 0 ? (
          <span className="text-gray-400">계좌를 추가해주세요</span>
        ) : selected && onlyCode ? (
          <span className="ml-2 text-gray-700 font-mono">{formatAccountNumber(selected.accountNumber)}</span>
        ) : selected && !onlyCode ? (
          <>
            <img src={currencyMeta[selected.currencyCode]?.flag} alt={selected.currencyCode} className="w-6 h-6 mr-2" />
            <span>{selected.currencyCode} - {currencyMeta[selected.currencyCode]?.name}</span>
            <span className="ml-2 text-gray-500 font-mono">({selected.accountNumber})</span>
          </>
        ) : (
          <span className="text-gray-400">계좌를 선택하세요</span>
        )}
        <span className="ml-auto mr-2 text-gray-400 text-2xl">▼</span>
      </button>
      {open && (
        <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto animate-fadeIn">
          {accounts.length === 0 ? (
            <div className="text-center text-gray-400 py-6">등록된 계좌가 없습니다.</div>
          ) : accounts.map(acc => (
            <button
              key={acc.accountNumber}
              type="button"
              className={`flex items-center w-full px-4 py-3 hover:bg-blue-50 transition text-left ${acc.accountNumber === value ? "bg-blue-100" : ""}`}
              onClick={() => { onChange(acc.accountNumber); setOpen(false); }}
            >
              {onlyCode
                ? <><img src={currencyMeta[acc.currencyCode]?.flag} alt={acc.currencyCode} className="w-6 h-6 mr-2" /><span className="text-gray-700 font-mono">{formatAccountNumber(acc.accountNumber)}</span></>
                : <><img src={currencyMeta[acc.currencyCode]?.flag} alt={acc.currencyCode} className="w-6 h-6 mr-2" />
                  <span className="font-semibold">{acc.currencyCode}</span>
                  <span className="ml-2 text-gray-600">{currencyMeta[acc.currencyCode]?.name}</span>
                  <span className="ml-2 text-gray-500 font-mono">({acc.accountNumber})</span>
                </>
              }
            </button>
          ))}
          <button
            type="button"
            className="flex items-center w-full px-4 py-3 hover:bg-blue-50 transition text-left text-blue-600 font-semibold"
            onClick={() => { setOpen(false); if (onAddAccount) onAddAccount(); }}
          >
            <Plus className="w-5 h-5 mr-2" /> 계좌 추가
          </button>
        </div>
      )}
    </div>
  );
} 