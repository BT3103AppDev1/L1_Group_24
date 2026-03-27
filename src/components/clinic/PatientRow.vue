<!--
  This component represents a single row in the clinic's queue table.
  It displays the patient's queue details and allows the clinic to update
  their status using a dropdown.
-->
<template>
    <!-- 
      The entire row is clickable. Clicking it emits a 'view' event, passing the ticket 
      up to the parent component so that a details popup (like a Modal) can be shown. 
    -->
    <tr class="patient-row" @click="$emit('view', ticket)">

        <!-- Displays the numbered position (1, 2, 3...) passed from the parent -->
        <td class="col-num">{{ index }}</td>

        <!-- Displays the standardized ticket number (e.g. Q001, Q002) -->
        <td class="col-ticket"><span class="ticket-badge">{{ ticket.ticketNumber }}</span></td>

        <!-- Displays the patient's name, or '--' if they didn't provide one -->
        <td class="col-name">{{ ticket.patientName || '--' }}</td>

        <!-- Optionally shows the service name if 'showService' prop is set to true -->
        <td v-if="showService" class="col-service">{{ ticket.serviceName || '--' }}</td>

        <!-- Displays estimated wait time. If it's 0 or less, it shows "Now" indicating it's their turn -->
        <td class="col-wait">
            <span v-if="ticket.estimatedWaitTime > 0">{{ ticket.estimatedWaitTime }} min</span>
            <span v-else class="now-text">Now</span>
        </td>

        <!-- Shows a styled visual badge representing the current status of the ticket -->
        <td class="col-status">
            <AppBadge :variant="ticket.status">{{ statusLabel(ticket.status) }}</AppBadge>
        </td>

        <!-- 
          The "@click.stop" prevents the row's @click event from firing when the dropdown is clicked.
          Otherwise, changing the status would accidentally open the patient details modal! 
        -->
        <td class="col-actions" @click.stop>
            <select class="status-dropdown" :class="selectClass(ticket.status)" :value="ticket.status"
                @change="onStatusChange">
                <option value="waiting">Waiting</option>
                <option value="serving">Serving</option>
                <option value="completed">Completed</option>
                <option value="no-show">No Show</option>
                <option value="cancelled">Cancelled</option>
            </select>
        </td>
    </tr>
</template>

<script setup>
import AppBadge from '@/components/base/AppBadge.vue'

// These are the inputs this component accepts from its parent layout (like QueueDashboardView)
const props = defineProps({
    ticket: { type: Object, required: true },       // The actual patient queue data object
    index: { type: Number, default: 0 },            // The patient's numerical place in line
    showService: { type: Boolean, default: false }, // Whether to render the service column
})

// These define the customizable events this component can "shout" up to the parent.
const emit = defineEmits(['update-status', 'view'])

// --- Helper Functions ---
// Dictionary mapping raw data status to pretty, human-readable labels
const labels = { waiting: 'Waiting', serving: 'Serving', completed: 'Completed', 'no-show': 'No Show', cancelled: 'Cancelled' }

/**
 * Converts a raw status like "no-show" into the pretty format "No Show"
 */
function statusLabel(status) { return labels[status] || status }

/**
 * Returns a custom CSS class name for styling the select dropdown based on status.
 */
function selectClass(status) {
    return status === 'no-show' ? 'noshow' : status
}

/**
 * Triggered whenever the clinic chooses a new status from the dropdown.
 * We emit an 'update-status' event containing the Ticket ID and the New Status
 * so the parent dashboard can tell the database to update it!
 */
function onStatusChange(e) {
    const status = e.target.value
    if (status !== props.ticket.status) {
        emit('update-status', { ticketId: props.ticket.id, status })
    }
}
</script>

<style scoped>
.patient-row {
    cursor: pointer;
}

.patient-row:hover td {
    background: rgba(239, 246, 255, 0.5);
}

.patient-row td {
    padding: var(--space-md);
    vertical-align: middle;
    font-size: 0.95rem;
    border-bottom: 1px solid var(--color-border);
}

.col-num {
    width: 56px;
    color: #94a3b8;
    font-family: var(--font-display);
    font-weight: 700;
}

.col-ticket {
    width: 120px;
}

.ticket-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.45rem 0.95rem;
    border-radius: var(--radius-full);
    background: var(--color-primary-light);
    color: var(--color-primary-dark);
    font-family: var(--font-display);
    font-size: 0.9rem;
    font-weight: 800;
    letter-spacing: 0.03em;
}

.col-wait {
    font-weight: 700;
    color: var(--color-text-main);
}

.now-text {
    color: var(--color-text-green);
}

.status-dropdown {
    width: 100%;
}
</style>
