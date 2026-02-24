import { useState } from 'react';
import { Delete } from 'lucide-react';

const ROW1 = 'qwertyuiop';
const ROW2 = 'asdfghjkl';
const ROW3 = 'zxcvbnm';
const ROW4 = '1234567890';
const SYMBOLS = '@.-_!#$*';

interface OnScreenKeyboardProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'password';
  maskValue?: boolean;
  mode?: 'default' | 'numeric';
  maxLength?: number;
  onSubmit?: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
}

export function OnScreenKeyboard({
  value,
  onChange,
  type = 'text',
  maskValue,
  mode = 'default',
  maxLength,
  onSubmit,
  submitLabel = 'Done',
  submitDisabled = false,
}: OnScreenKeyboardProps) {
  const [shift, setShift] = useState(false);
  const [showNumbers, setShowNumbers] = useState(false);
  const showPassword = maskValue ?? (type === 'password');

  const insert = (char: string) => {
    let next = value + char;
    if (maxLength != null && next.length > maxLength) next = next.slice(0, maxLength);
    onChange(next);
  };

  const backspace = () => {
    onChange(value.slice(0, -1));
  };

  const renderRow = (row: string) => (
    <div className="flex justify-center gap-1">
      {row.split('').map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => insert(shift ? c.toUpperCase() : c)}
          className="touch-target min-w-[28px] h-10 px-2 bg-white border-2 border-gray-300 rounded-lg text-lg font-medium active:bg-gray-200"
        >
          {shift ? c.toUpperCase() : c}
        </button>
      ))}
    </div>
  );

  const displayValue = showPassword ? '•'.repeat(value.length) : (value || ' ');

  if (mode === 'numeric') {
    return (
      <div className="flex flex-col gap-2 p-2 bg-gray-100 rounded-xl">
        <div className="flex items-center justify-center gap-2 px-3 py-3 bg-white border-2 border-gray-300 rounded-xl min-h-[52px]">
          <span className="text-2xl font-mono tracking-[0.4em] tabular-nums">
            {value.padEnd(maxLength ?? 4, '·')}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', ''].map((c) =>
            c === '' ? (
              <div key="empty" />
            ) : c === '⌫' ? (
              <button
                key="back"
                type="button"
                onClick={backspace}
                className="touch-target h-12 bg-gray-200 border-2 border-gray-300 rounded-xl text-lg font-medium active:bg-gray-300"
              >
                <Delete className="w-6 h-6 mx-auto" />
              </button>
            ) : (
              <button
                key={c}
                type="button"
                onClick={() => insert(c)}
                className="touch-target h-12 bg-white border-2 border-gray-300 rounded-xl text-xl font-medium active:bg-gray-200"
              >
                {c}
              </button>
            )
          )}
        </div>
        {onSubmit && (
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitDisabled || (maxLength != null ? value.length !== maxLength : false)}
            className="touch-target w-full h-12 bg-gray-800 text-white rounded-xl font-medium active:bg-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitLabel}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-2 bg-gray-100 rounded-xl">
      {/* Display field */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white border-2 border-gray-300 rounded-xl min-h-[52px]">
        <span className="flex-1 text-xl font-medium tracking-wide truncate">
          {displayValue}
        </span>
      </div>
      {/* Keyboard rows */}
      <div className="flex flex-col gap-1.5">
        {!showNumbers ? (
          <>
            {renderRow(ROW1)}
            {renderRow(ROW2)}
            <div className="flex justify-center gap-1">
              {ROW3.split('').map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => insert(shift ? c.toUpperCase() : c)}
                  className="touch-target min-w-[28px] h-10 px-2 bg-white border-2 border-gray-300 rounded-lg text-lg font-medium active:bg-gray-200"
                >
                  {shift ? c.toUpperCase() : c}
                </button>
              ))}
              <button
                type="button"
                onClick={backspace}
                className="touch-target min-w-[40px] h-10 px-2 bg-gray-200 border-2 border-gray-300 rounded-lg active:bg-gray-300"
              >
                <Delete className="w-5 h-5 mx-auto" />
              </button>
            </div>
            <div className="flex justify-center gap-1">
              <button
                type="button"
                onClick={() => setShift(!shift)}
                className="touch-target h-10 px-3 bg-gray-200 border-2 border-gray-300 rounded-lg text-sm font-medium active:bg-gray-300"
              >
                {shift ? 'ABC' : 'abc'}
              </button>
              <button
                type="button"
                onClick={() => setShowNumbers(true)}
                className="touch-target h-10 px-3 bg-gray-200 border-2 border-gray-300 rounded-lg text-sm font-medium active:bg-gray-300"
              >
                123
              </button>
              <button
                type="button"
                onClick={() => insert(' ')}
                className="touch-target flex-1 max-w-[120px] h-10 bg-white border-2 border-gray-300 rounded-lg active:bg-gray-200"
              />
            </div>
          </>
        ) : (
          <>
            {/* Numbers row: 1-9, 0 */}
            <div className="flex justify-center gap-1">
              {ROW4.split('').map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => insert(c)}
                  className="touch-target min-w-[28px] h-10 px-2 bg-white border-2 border-gray-300 rounded-lg text-lg font-medium active:bg-gray-200"
                >
                  {c}
                </button>
              ))}
            </div>
            {/* Symbols row: @ . - _ ! # $ * and backspace */}
            <div className="flex justify-center gap-1 flex-wrap">
              {SYMBOLS.split('').map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => insert(c)}
                  className="touch-target min-w-[28px] h-10 px-2 bg-white border-2 border-gray-300 rounded-lg text-lg font-medium active:bg-gray-200"
                >
                  {c}
                </button>
              ))}
              <button
                type="button"
                onClick={backspace}
                className="touch-target min-w-[40px] h-10 px-2 bg-gray-200 border-2 border-gray-300 rounded-lg active:bg-gray-300"
              >
                <Delete className="w-5 h-5 mx-auto" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowNumbers(false)}
              className="touch-target w-full h-10 bg-gray-200 border-2 border-gray-300 rounded-lg text-sm font-medium active:bg-gray-300"
            >
              ABC
            </button>
          </>
        )}
      </div>
      {onSubmit && (
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitDisabled}
          className="touch-target w-full h-12 bg-gray-800 text-white rounded-xl font-medium active:bg-black disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitLabel}
        </button>
      )}
    </div>
  );
}
