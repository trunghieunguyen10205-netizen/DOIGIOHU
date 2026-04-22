import { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [tableId, setTableId] = useState(() => {
    return localStorage.getItem('table_id') || null;
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (tableId) localStorage.setItem('table_id', tableId);
  }, [tableId]);

  const addToCart = (item, options = {}, note = '') => {
    setCart(prev => {
      // Find if same item with same options already exists
      const existingIdx = prev.findIndex(i => 
        i.menu_item_id === item.id && 
        JSON.stringify(i.options) === JSON.stringify(options)
      );

      if (existingIdx !== -1) {
        const newCart = [...prev];
        newCart[existingIdx].quantity += 1;
        newCart[existingIdx].note = note || newCart[existingIdx].note;
        return newCart;
      }

      return [...prev, {
        menu_item_id: item.id,
        name: item.name,
        image: item.image,
        price_snapshot: item.price,
        quantity: 1,
        options,
        note
      }];
    });
  };

  const removeFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index, delta) => {
    setCart(prev => {
      const newCart = [...prev];
      newCart[index].quantity += delta;
      if (newCart[index].quantity <= 0) {
        return prev.filter((_, i) => i !== index);
      }
      return newCart;
    });
  };

  const clearCart = () => setCart([]);

  const totalAmount = cart.reduce((sum, item) => sum + (item.price_snapshot * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart, addToCart, removeFromCart, updateQuantity, clearCart, totalAmount, totalItems, tableId, setTableId
    }}>
      {children}
    </CartContext.Provider>
  );
};
