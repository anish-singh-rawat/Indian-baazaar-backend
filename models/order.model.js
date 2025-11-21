import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    channel_order_id : {
        type: String,
        default: ""
    },
    shipment_id : {
        type: String,
        default: ""
    },
    courier_name : {
        type: String,
        default: ""
    },
    awb_code : {
        type: String,
        default: ""
    },
    packaging_box_error : {
        type: String,
        default: ""
    },
    order_status : {
        type: String,
        default: ""
    },
    status_code : {
        type: String,
        default: ""
    },
    courier_company_id : {
        type: String,
        default: ""
    },
    new_channel : {
        type: String,
        default: ""
    },
    tax_invoice_pdf : {
        type: String,
        default: ""
    },
    paymentStatus: {
        type: String,
        enum: ['PENDING', 'SUCCESS', 'FAILED'],
    },
    shippingStatus : {
        type : String,
        enum: ['PENDING', 'SHIPPED', 'DELIVERED'],
    },
    settlementStatus : {
        type : String,
        enum: ['NOT_ELIGIBLE', 'ELIGIBLE', 'SETTLED', "PAID"],
    },
    products: [
        {
            productId: {
                type: String
            },
            productTitle: {
                type: String
            },
            quantity: {
                type: Number
            },
            price: {
                type: Number
            },
            image: {
                type: String
            },
            sub_total: {
                type: Number
            }
        }
    ],
    paymentId: {
        type: String,
        default: ""
    },
    payment_status : {
        type : String,
        default : ""
    },
    order_status : {
        type : String,
        default : "Pendding"
    },
    delivery_address: {
        type: mongoose.Schema.ObjectId,
        ref: 'address'
    },
    deliveredAt : {
        type: Date,
    },
    totalAmt: {
        type: Number,
        default: 0
    },
    platformCommission : {
        type : Number,
        default : 5
    },
    retailerId : {
        type : mongoose.Schema.ObjectId,
        ref : 'Retailer'
    },
    paymentApprovalByAdmin: {
        type: Boolean,
        default: false
    },
    paymentApprovalAt: {
        type: Date,
    },
    paymentReleased: {
        type: Boolean,
        default: false
    },
    paymentReleasedAt: {
        type: Date,
    },
}, {
    timestamps: true
})

const OrderModel = mongoose.model('order', orderSchema)

export default OrderModel