import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';

function PopoutWindow({ title, onClose, children }) {
  const [container, setContainer] = useState(null);
  const externalWindowRef = useRef(null);

useEffect(() => {
    // Calculate a good size: 80% of the screen width/height
    const w = window.screen.width * 0.8;
    const h = window.screen.height * 0.8;
    const left = (window.screen.width / 2) - (w / 2);
    const top = (window.screen.height / 2) - (h / 2);

    const externalWindow = window.open(
      '', 
      '', 
      `width=${w},height=${h},left=${left},top=${top},resizable,scrollbars,status`
    );

    if (!externalWindow) {
        alert("Pop-up blocked! Please allow pop-ups for this site.");
        if (onClose) onClose();
        return;
    }

    externalWindowRef.current = externalWindow;
    
    // 2. Wait for window to load before manipulating (Important for some browsers)
    externalWindow.document.title = title || 'Ohmni Pop-out';
    
    // 3. Create Container
    const div = externalWindow.document.createElement('div');
    div.setAttribute('id', 'popout-root');
    // Force dark theme immediately to prevent white flash
    div.style.backgroundColor = '#1e1e1e'; 
    div.style.minHeight = '100vh';
    div.style.color = '#dcdcdc';
    div.style.boxSizing = 'border-box';
    
    externalWindow.document.body.appendChild(div);
    externalWindow.document.body.style.margin = '0';
    externalWindow.document.body.style.backgroundColor = '#1e1e1e';

    // 4. Copy CSS - Filtered to prevent CORS errors on external stylesheets
    Array.from(document.styleSheets).forEach((styleSheet) => {
      try {
        if (styleSheet.href) {
          const newLink = externalWindow.document.createElement('link');
          newLink.rel = 'stylesheet';
          newLink.href = styleSheet.href;
          externalWindow.document.head.appendChild(newLink);
        } else if (styleSheet.cssRules) {
          const newStyle = externalWindow.document.createElement('style');
          Array.from(styleSheet.cssRules).forEach((rule) => {
            newStyle.appendChild(externalWindow.document.createTextNode(rule.cssText));
          });
          externalWindow.document.head.appendChild(newStyle);
        }
      } catch (e) {
        // console.warn("Could not copy stylesheet:", e);
      }
    });

    setContainer(div);

    // 5. Cleanup Listener
    const handleBeforeUnload = () => {
        if (onClose) onClose();
    };
    externalWindow.addEventListener('beforeunload', handleBeforeUnload);

    // 6. Cleanup function (Close window when parent unmounts)
    return () => {
      externalWindow.removeEventListener('beforeunload', handleBeforeUnload);
      externalWindow.close();
    };
  }, []);

  return container ? createPortal(children, container) : null;
}

export default PopoutWindow;