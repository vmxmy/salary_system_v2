import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../store';

// 使用这个自定义hook而不是普通的useDispatch
export const useAppDispatch = () => useDispatch<AppDispatch>();
