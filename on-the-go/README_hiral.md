<!-- Hiral's Readme -->

npx expo start -c

<!-- PERSISTANT STATE -->
# What is persisted

Task title
Completed state
Display place
Matching places

# What is not persisted

Nearby store search results, because they depend on current location and can go stale

# TODO

1. We should allow user to select store type "grocery/pharmacy etc" in addition to us already tagging it eg. Advil can be got from grocery + pharmacy
2. Title tagline: Smart reminders for errands you can finish nearby.
3. [DONE] If i mark an item done that was nearby, the nearby opportunity banner should go away
4. [REMOVED] Adding items text box can be made auto-complete or better?
5. [DONE] 1 near CVS looks weird
6. user should be able to provide location by themselves as well?
7. [DONE] Make task items editable
8. If user adds duplicate items with slightly different text- what to do?
9. Catgeory limitation - what if someone wants to add a task that is not found on map like clean house, give candle to purva etc?

# app/(tabs)/index.tsx

components/
  nearby-opportunity-card.tsx
  task-input.tsx
  task-list.tsx
constants/
  task-matching.ts
hooks/
  use-nearby-stores.ts
  use-notifications.ts
types/
  task.ts
  nearby-store.ts

- app/(tabs)/index.tsx
Holds screen state.
Wires components together.
Should stay mostly layout/composition.

- types/task.ts
Task type.

- types/nearby-store.ts
NearbyStore type.

- constants/task-matching.ts
matchPlace(taskTitle).
Later: store/category matching rules.

- hooks/use-notifications.ts
Request notification permission.
Send opportunity notification.

- hooks/use-nearby-stores.ts
Request location permission.
Get current location.
Call Places API.
Return { nearbyStores, selectedStore, status, loadNearbyStores, setSelectedStoreId }.

- components/nearby-opportunity-card.tsx
Renders opportunity text.
Buttons: Find nearby stores, Notify.

- components/task-input.tsx
Text box + Add button.

- components/task-list.tsx
Reminder-style selectable task rows.
  