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
4. [REMOVED] Adding items text box can be made auto-complete or better? NEED IT AGAIN
5. [DONE] 1 near CVS looks weird
6. user should be able to provide location by themselves as well?
7. [DONE] Make task items editable
8. If user adds duplicate items with slightly different text- what to do?
9. Catgeory limitation - what if someone wants to add a task that is not found on map like clean house, give candle to purva etc?
10. Smarter locations: nearby stores for each category shown first so max tasks can be done nearby? Maybe stretch
11. Smart categorization
12. Map snippet should be better
13. Car wash: not at gas station
14. Nearby tab: only notify for a particular store: add bell button
15. inaccurate drive and walk time
16. sharing list with household
17. Android version
18. Urgent items

### Smart Notifications

1. Added shared nearby lookup service so UI and alerts use the same store/category logic.
2. Added live foreground alert checks when location permission is already granted.
3. Added background-alert infrastructure with Enable alerts / Alerts on button on the Nearby tab.
4. Added caching and throttling:Google lookup cache TTL: 20 minutes
only re-checks after ~0.25 mi movement or cache expiry
notification cooldown: 3 hours per category/store

5. Notifications use only nearest store per active category and combine multiple categories into one notification.
6. Added native config for background location and notifications.
7. Installed expo-task-manager.

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
  