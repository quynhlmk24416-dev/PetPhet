/**
 * Shared data shapes of the Pet Phết app, documented as JSDoc typedefs.
 * Import nothing from this file at runtime - it exists for editor IntelliSense and documentation.
 * Example: /** @type {import('./types.js').Booking} *\/
 */

/**
 * @typedef {Object} UserProfile
 * @property {string} id
 * @property {string} email
 * @property {string} full_name
 * @property {string} phone
 * @property {UserRole} role
 * @property {string} [avatar_url]
 * @property {string} created_at
 */

/**
 * @typedef {Object} Pet
 * @property {string} id
 * @property {string} user_id
 * @property {string} pet_name
 * @property {PetSpecies} species
 * @property {string} breed
 * @property {PetGender} gender
 * @property {string} birth_date
 * @property {number} weight in kg
 * @property {string} [weight_updated_at]
 * @property {string} [notes]
 * @property {string} [health_status]
 * @property {string} [vaccination_history]
 * @property {string} [avatar_url]
 * @property {boolean} is_active
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} ServiceCategory
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} icon
 * @property {boolean} is_active
 */

/**
 * @typedef {Object} ServicePricingTier
 * @property {string} id
 * @property {string} service_id
 * @property {number} min_weight
 * @property {number} max_weight
 * @property {number} price
 */

/**
 * @typedef {Object} Service
 * @property {string} id
 * @property {string} category_id
 * @property {string} service_name
 * @property {string} description
 * @property {number} base_price
 * @property {boolean} is_weight_based
 * @property {ServicePricingTier[]} [pricing_tiers]
 * @property {number} duration_minutes
 * @property {PetSpecies[]} species_supported
 * @property {string} image_url
 * @property {boolean} is_active
 * @property {number} rating_avg
 * @property {number} rating_count
 * @property {string} created_at
 */

/**
 * @typedef {Object} WorkingSchedule
 * @property {string} id
 * @property {string} work_date YYYY-MM-DD
 * @property {string} start_time e.g. "08:00"
 * @property {string} end_time e.g. "20:00"
 * @property {boolean} is_available
 * @property {number} max_concurrent_capacity
 * @property {number} slot_duration_minutes
 * @property {string} [notes]
 */

/**
 * @typedef {Object} TimeSlot
 * @property {string} id
 * @property {string} schedule_id
 * @property {string} time e.g. "09:00"
 * @property {number} capacity
 * @property {number} booked_count
 * @property {'available' | 'busy' | 'locked'} status
 */

/**
 * @typedef {Object} Booking
 * @property {string} id e.g. "BK-2610-001"
 * @property {string} user_id
 * @property {string} user_name
 * @property {string} user_phone
 * @property {string} user_email
 * @property {string} pet_id
 * @property {string} pet_name
 * @property {PetSpecies} pet_species
 * @property {number} pet_weight
 * @property {string} service_id
 * @property {string} service_name
 * @property {string} booking_date YYYY-MM-DD
 * @property {string} booking_time HH:mm
 * @property {number} duration_minutes
 * @property {string} end_time HH:mm
 * @property {number} original_price
 * @property {number} discount_amount
 * @property {number} total_amount
 * @property {string} [coupon_code]
 * @property {PaymentMethod} payment_method
 * @property {PaymentStatus} payment_status
 * @property {BookingStatus} status
 * @property {string} [customer_note]
 * @property {string} [admin_note]
 * @property {string} [cancellation_reason]
 * @property {string} [cancelled_at]
 * @property {string} [completed_at]
 * @property {string} [hold_expires_at] hold duration timestamp for QR
 * @property {boolean} [is_reviewed]
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} PaymentTransaction
 * @property {string} id
 * @property {string} booking_id
 * @property {number} amount
 * @property {PaymentMethod} payment_method
 * @property {PaymentStatus} payment_status
 * @property {string} transaction_reference
 * @property {string} account_number
 * @property {string} bank_name
 * @property {string} account_holder
 * @property {string} transfer_content
 * @property {string} [verified_by]
 * @property {string} [verified_at]
 * @property {string} created_at
 */

/**
 * @typedef {Object} Review
 * @property {string} id
 * @property {string} booking_id
 * @property {string} service_id
 * @property {string} user_id
 * @property {string} user_name
 * @property {string} pet_name
 * @property {number} rating 1 to 5
 * @property {string} comment
 * @property {string} [image_url]
 * @property {string} [admin_reply]
 * @property {string} [admin_replied_at]
 * @property {number} points_awarded
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} Coupon
 * @property {string} id
 * @property {string} code
 * @property {'percent' | 'fixed'} discount_type
 * @property {number} discount_value percentage (0-100) or fixed amount in VND
 * @property {number} min_order_value
 * @property {number} [max_discount_amount]
 * @property {boolean} is_active
 * @property {string} expires_at
 * @property {number} usage_limit
 * @property {number} used_count
 * @property {string} description
 */

/**
 * @typedef {Object} PetPointTransaction
 * @property {string} id
 * @property {string} user_id
 * @property {number} amount e.g. +1000
 * @property {'earn_review' | 'system_adjustment'} type
 * @property {string} reference_id booking_id or review_id
 * @property {string} description
 * @property {string} created_at
 */

/**
 * @typedef {Object} AppNotification
 * @property {string} id
 * @property {string} [user_id] empty/null for admin notifications
 * @property {'customer' | 'admin' | 'all'} target_role
 * @property {string} title
 * @property {string} content
 * @property {'booking' | 'payment' | 'review' | 'points' | 'promotion' | 'system'} type
 * @property {boolean} is_read
 * @property {string} created_at
 */

/**
 * @typedef {'customer' | 'admin'} UserRole
 */

/**
 * @typedef {'Chó' | 'Mèo' | 'Khác'} PetSpecies
 */

/**
 * @typedef {'Đực' | 'Cái' | 'Chưa xác định'} PetGender
 */

/**
 * @typedef {| 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'} BookingStatus
 */

/**
 * @typedef {'COD' | 'QR'} PaymentMethod
 */

/**
 * @typedef {| 'unpaid' | 'pending_reconcile' | 'paid' | 'failed' | 'refunded'} PaymentStatus
 */

export {};
