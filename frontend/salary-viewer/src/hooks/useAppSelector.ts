import { useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState } from '../store';

// 使用这个自定义hook而不是普通的useSelector
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
