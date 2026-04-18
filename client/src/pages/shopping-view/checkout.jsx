import Address from "@/components/shopping-view/address";
import img from "../../assets/account.jpg";
import { useDispatch, useSelector } from "react-redux";
import UserCartItemsContent from "@/components/shopping-view/cart-items-content";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { capturePayment, createNewOrder } from "@/store/shop/order-slice";
import { useToast } from "@/components/ui/use-toast";

function ShoppingCheckout() {
  const { cartItems } = useSelector((state) => state.shopCart);
  const { user } = useSelector((state) => state.auth);
  const { razorpayOrder } = useSelector((state) => state.shopOrder);
  const [currentSelectedAddress, setCurrentSelectedAddress] = useState(null);
  const [isPaymentStart, setIsPaymemntStart] = useState(false);
  const dispatch = useDispatch();
  const { toast } = useToast();

  const totalCartAmount =
    cartItems && cartItems.items && cartItems.items.length > 0
      ? cartItems.items.reduce(
          (sum, currentItem) =>
            sum +
            (currentItem?.salePrice > 0
              ? currentItem?.salePrice
              : currentItem?.price) *
              currentItem?.quantity,
          0
        )
      : 0;

  function handleInitiateRazorpayPayment() {
    if (!cartItems?.items?.length) {
      toast({
        title: "Your cart is empty. Please add items to proceed",
        variant: "destructive",
      });

      return;
    }

    if (currentSelectedAddress === null) {
      toast({
        title: "Please select one address to proceed.",
        variant: "destructive",
      });

      return;
    }

    if (!/^\d{6}$/.test(currentSelectedAddress?.pincode || "")) {
      toast({
        title: "Selected address ka pincode 6 digits ka hona chahiye.",
        variant: "destructive",
      });

      return;
    }

    if (!/^\d{10}$/.test(currentSelectedAddress?.phone || "")) {
      toast({
        title: "Selected address ka mobile number 10 digits ka hona chahiye.",
        variant: "destructive",
      });

      return;
    }

    if (totalCartAmount < 1) {
      toast({
        title: "Minimum order amount should be at least ₹1 for Razorpay.",
        variant: "destructive",
      });

      return;
    }

    if (!window.Razorpay) {
      toast({
        title: "Razorpay SDK load nahi hui. Page refresh karke dobara try karein.",
        variant: "destructive",
      });

      return;
    }

    const orderData = {
      userId: user?.id,
      cartId: cartItems?._id,
      cartItems: cartItems.items.map((singleCartItem) => ({
        productId: singleCartItem?.productId,
        title: singleCartItem?.title,
        image: singleCartItem?.image,
        price:
          singleCartItem?.salePrice > 0
            ? singleCartItem?.salePrice
            : singleCartItem?.price,
        quantity: singleCartItem?.quantity,
      })),
      addressInfo: {
        addressId: currentSelectedAddress?._id,
        address: currentSelectedAddress?.address,
        city: currentSelectedAddress?.city,
        pincode: currentSelectedAddress?.pincode,
        phone: currentSelectedAddress?.phone,
        notes: currentSelectedAddress?.notes,
      },
      orderStatus: "pending",
      paymentMethod: "razorpay",
      paymentStatus: "pending",
      totalAmount: totalCartAmount,
      orderDate: new Date(),
      orderUpdateDate: new Date(),
      paymentId: "",
      payerId: "",
    };

    dispatch(createNewOrder(orderData)).then((action) => {
      if (action?.payload?.success) {
        setIsPaymentStart(true);
      } else {
        setIsPaymentStart(false);
        toast({
          title:
            action?.payload?.message ||
            "Razorpay order create nahi ho paya. Dobara try karein.",
          variant: "destructive",
        });
      }
    });
  }

  useEffect(() => {
    if (razorpayOrder && window.Razorpay) {
      const options = {
        key: "rzp_test_SZN8WmepRojC7T",
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "Little Luxe",
        description: "Order Payment",
        order_id: razorpayOrder.id,
        handler: function (response) {
          const paymentId = response.razorpay_payment_id;
          const orderId = JSON.parse(sessionStorage.getItem("currentOrderId"));

          dispatch(capturePayment({ paymentId, orderId })).then((data) => {
            if (data?.payload?.success) {
              sessionStorage.removeItem("currentOrderId");
              window.location.href = "/shop/payment-success";
            } else {
              setIsPaymemntStart(false);
              toast({
                title: "Payment capture nahi ho paya.",
                variant: "destructive",
              });
            }
          });
        },
        modal: {
          ondismiss: function () {
            setIsPaymemntStart(false);
          },
        },
        prefill: {
          name: user?.userName || "",
          email: user?.email || "",
          contact: currentSelectedAddress?.phone || "",
        },
        notes: {
          address: currentSelectedAddress?.address || "",
        },
        theme: {
          color: "#3399cc",
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", function () {
        setIsPaymemntStart(false);
        toast({
          title: "Razorpay payment start nahi ho paya.",
          variant: "destructive",
        });
      });

      rzp.open();
    }
  }, [razorpayOrder, dispatch, user, currentSelectedAddress, toast]);

  return (
    <div className="flex flex-col">
      <div className="relative h-[300px] w-full overflow-hidden">
        <img src={img} className="h-full w-full object-cover object-center" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5 p-5">
        <Address
          selectedId={currentSelectedAddress}
          setCurrentSelectedAddress={setCurrentSelectedAddress}
        />
        <div className="flex flex-col gap-4">
          {cartItems && cartItems.items && cartItems.items.length > 0
            ? cartItems.items.map((item) => (
                <UserCartItemsContent cartItem={item} />
              ))
            : null}
          <div className="mt-8 space-y-4">
            <div className="flex justify-between">
              <span className="font-bold">Total</span>
              <span className="font-bold">₹{totalCartAmount}</span>
            </div>
          </div>
          <div className="mt-4 w-full">
            <Button
              onClick={handleInitiateRazorpayPayment}
              className="w-full"
              disabled={isPaymentStart}
            >
              {isPaymentStart
                ? "Processing Razorpay Payment..."
                : "Checkout with Razorpay"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShoppingCheckout;
