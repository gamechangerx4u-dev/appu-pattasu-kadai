export const generateWhatsAppLink = (
  cartItems,
  subtotal,
  discount,
  totalAmount,
  couponCode = '',
  customerDetails = {}
) => {
  const shopOwnerNumber = "9876543210"; // Placeholder random 10-digit number
  const { phone = '', email = '', address = '' } = customerDetails;
  
  let message = `*New Order Enquiry* 🧨✨\n\n`;
  message += `*Customer Details:*\n`;
  message += `Phone: ${phone || 'Not provided'}\n`;
  message += `Email: ${email || 'Not provided'}\n`;
  message += `Address: ${address || 'Not provided'}\n\n`;
  message += `*Order Details:*\n`;
  
  cartItems.forEach((item, index) => {
    message += `${index + 1}. ${item.name} x ${item.quantity} = ₹${(item.ourPrice * item.quantity).toFixed(2)}\n`;
  });
  
  message += `\n*Subtotal:* ₹${subtotal.toFixed(2)}`;
  
  if (couponCode) {
    message += `\n*Coupon Applied (${couponCode}):* -₹${discount.toFixed(2)}`;
  }

  message += `\n*Total Payable (Including GST):* ₹${totalAmount.toFixed(2)}\n\n`;
  message += `Please confirm my order. Thank you!`;
  
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/91${shopOwnerNumber}?text=${encodedMessage}`;
};
