import { useEffect } from 'react';

/**
 * 全局禁用自动填充的Hook
 * 通过动态修改input的autocomplete属性来防止浏览器自动填充
 */
export const useDisableAutocomplete = () => {
  useEffect(() => {
    // 禁用所有input的自动填充
    const disableAutocomplete = () => {
      const inputs = document.querySelectorAll('input');
      inputs.forEach((input) => {
        // 设置多个属性来确保禁用自动填充
        input.setAttribute('autocomplete', 'new-password');
        input.setAttribute('autocorrect', 'off');
        input.setAttribute('autocapitalize', 'off');
        input.setAttribute('spellcheck', 'false');
        
        // 对于某些浏览器，需要动态改变name属性
        const originalName = input.name;
        if (originalName) {
          // 添加随机后缀，防止浏览器记住
          input.setAttribute('name', `${originalName}_${Date.now()}`);
          
          // 在表单提交前恢复原始name
          const form = input.closest('form');
          if (form) {
            const handleSubmit = (e: Event) => {
              input.setAttribute('name', originalName);
              // 提交后再次修改，防止下次记住
              setTimeout(() => {
                input.setAttribute('name', `${originalName}_${Date.now()}`);
              }, 100);
            };
            
            form.addEventListener('submit', handleSubmit);
            
            // 清理函数
            return () => {
              form.removeEventListener('submit', handleSubmit);
            };
          }
        }
      });
    };

    // 初始执行
    disableAutocomplete();

    // 监听DOM变化，处理动态添加的input
    const observer = new MutationObserver(() => {
      disableAutocomplete();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      observer.disconnect();
    };
  }, []);
};

/**
 * 为特定表单禁用自动填充
 * @param formId 表单的ID或class选择器
 */
export const useDisableFormAutocomplete = (formSelector: string) => {
  useEffect(() => {
    const form = document.querySelector(formSelector);
    if (!form) return;

    const inputs = form.querySelectorAll('input');
    const originalValues: Map<HTMLInputElement, string> = new Map();

    inputs.forEach((input) => {
      // 保存原始name
      originalValues.set(input, input.name);
      
      // 使用随机值防止自动填充
      input.setAttribute('autocomplete', 'off');
      input.setAttribute('readonly', 'true');
      
      // 聚焦时移除readonly
      input.addEventListener('focus', () => {
        input.removeAttribute('readonly');
      });
      
      // 失焦时恢复readonly
      input.addEventListener('blur', () => {
        if (!input.value) {
          input.setAttribute('readonly', 'true');
        }
      });
    });

    return () => {
      // 清理：恢复原始属性
      inputs.forEach((input) => {
        input.removeAttribute('readonly');
        const originalName = originalValues.get(input);
        if (originalName) {
          input.name = originalName;
        }
      });
    };
  }, [formSelector]);
};

/**
 * 创建一个假的隐藏表单来欺骗浏览器
 * 某些浏览器会填充页面上的第一个表单
 */
export const createDecoyForm = () => {
  const decoy = document.createElement('div');
  decoy.style.position = 'absolute';
  decoy.style.left = '-9999px';
  decoy.style.top = '-9999px';
  decoy.innerHTML = `
    <form autocomplete="off">
      <input type="text" name="fake_username_${Date.now()}" autocomplete="off" />
      <input type="password" name="fake_password_${Date.now()}" autocomplete="off" />
    </form>
  `;
  document.body.insertBefore(decoy, document.body.firstChild);
};