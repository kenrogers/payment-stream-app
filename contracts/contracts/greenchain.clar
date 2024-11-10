;; Power Producer Investment Contract

;; Constants for error handling
(define-constant ERR-ALREADY-INITIALIZED (err u100))
(define-constant ERR-NOT-INITIALIZED (err u101))
(define-constant ERR-UNAUTHORIZED (err u102))
(define-constant ERR-FUNDING-COMPLETE (err u103))
(define-constant ERR-FUNDING-NOT-COMPLETE (err u104))
(define-constant ERR-CONTRIBUTION-FAILED (err u105))
(define-constant ERR-ZERO-AMOUNT (err u106))
(define-constant ERR-EXCEEDS-GOAL (err u107))
(define-constant ERR-INSUFFICIENT-BALANCE (err u108))

;; Data variables
(define-data-var contract-owner principal tx-sender)
(define-data-var is-initialized bool false)
(define-data-var funding-goal uint u0)
(define-data-var total-contributions uint u0)
(define-data-var funding-complete bool false)

;; Map to track individual contributions
(define-map contributor-balances principal uint)

;; Initialize the contract with funding goal
(define-public (initialize (goal uint))
    (begin
        (asserts! (not (var-get is-initialized)) ERR-ALREADY-INITIALIZED)
        (asserts! (> goal u0) ERR-ZERO-AMOUNT)
        (var-set contract-owner tx-sender)
        (var-set funding-goal goal)
        (var-set is-initialized true)
        (ok true)
    )
)

;; Function for users to contribute funds
(define-public (contribute (amount uint))
    (begin
        (asserts! (var-get is-initialized) ERR-NOT-INITIALIZED)
        (asserts! (not (var-get funding-complete)) ERR-FUNDING-COMPLETE)
        (asserts! (> amount u0) ERR-ZERO-AMOUNT)
        
        ;; Check if contribution would exceed goal
        (asserts! (<= (+ (var-get total-contributions) amount) (var-get funding-goal)) 
                 ERR-EXCEEDS-GOAL)
        
        ;; Check if sender has sufficient balance
        (asserts! (>= (stx-get-balance tx-sender) amount) ERR-INSUFFICIENT-BALANCE)
        
        ;; Transfer STX from sender to contract
        (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
        
        ;; Update contributor's balance
        (map-set contributor-balances tx-sender 
            (+ (default-to u0 (map-get? contributor-balances tx-sender)) amount))
        
        ;; Update total contributions
        (var-set total-contributions (+ (var-get total-contributions) amount))
        
        ;; Check if funding goal is reached and update state
        (and 
            (>= (var-get total-contributions) (var-get funding-goal))
            (var-set funding-complete true))
        
        (ok amount)
    )
)

;; Function to distribute revenue to contributors
(define-public (distribute-revenue)
    (let (
        (revenue-amount (stx-get-balance (as-contract tx-sender)))
        (total-funds (var-get total-contributions))
    )
    (begin
        (asserts! (var-get funding-complete) ERR-FUNDING-NOT-COMPLETE)
        (asserts! (> revenue-amount u0) ERR-ZERO-AMOUNT)
        
        ;; Transfer revenue to contract owner (power producer operator)
        (try! (as-contract (stx-transfer? 
            (/ (* revenue-amount u10) u100)  ;; 10% operator fee
            tx-sender 
            (var-get contract-owner))))
        
        (ok true)
    ))
)

;; Function for contributors to claim their share of revenue
(define-public (claim-revenue)
    (let (
        (contributor-amount (default-to u0 (map-get? contributor-balances tx-sender)))
        (total-funds (var-get total-contributions))
        (contract-balance (stx-get-balance (as-contract tx-sender)))
        (share (/ (* contributor-amount contract-balance) total-funds))
    )
    (begin
        (asserts! (var-get funding-complete) ERR-FUNDING-NOT-COMPLETE)
        (asserts! (> contributor-amount u0) ERR-ZERO-AMOUNT)
        
        ;; Transfer proportional share to contributor
        (try! (as-contract (stx-transfer? share tx-sender tx-sender)))
        
        (ok share)
    ))
)

;; Read-only functions for querying contract state

(define-read-only (get-contribution (user principal))
    (default-to u0 (map-get? contributor-balances user))
)

(define-read-only (get-total-contributions)
    (var-get total-contributions)
)

(define-read-only (get-funding-goal)
    (var-get funding-goal)
)

(define-read-only (is-funding-complete)
    (var-get funding-complete)
)

(define-read-only (get-contribution-percentage (user principal))
    (let (
        (user-contribution (default-to u0 (map-get? contributor-balances user)))
        (total (var-get total-contributions))
    )
    (if (> total u0)
        (/ (* user-contribution u100) total)
        u0)
    )
)