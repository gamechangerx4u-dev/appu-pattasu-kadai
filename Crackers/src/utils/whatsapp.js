export const generateWhatsAppLink = (cartItems, subtotal, discount, gst, totalAmount, couponCode = '') => {
  const shopOwnerNumber = "9876543210"; // Placeholder random 10-digit number
  
  let message = `*New Order Enquiry* 🧨✨\n\n`;
  message += `*Order Details:*\n`;
  
  cartItems.forEach((item, index) => {
    message += `${index + 1}. ${item.name} x ${item.quantity} = ₹${(item.ourPrice * item.quantity).toFixed(2)}\n`;
  });
  
  message += `\n*Subtotal:* ₹${subtotal.toFixed(2)}`;
  
  if (couponCode) {
    message += `\n*Coupon Applied (${couponCode}):* -₹${discount.toFixed(2)}`;
  }

  message += `\n*GST (18%):* ₹${gst.toFixed(2)}`;
  
  message += `\n*Total Payable:* ₹${totalAmount.toFixed(2)}\n\n`;
  message += `Please confirm my order. Thank you!`;
  
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/91${shopOwnerNumber}?text=${encodedMessage}`;
};
