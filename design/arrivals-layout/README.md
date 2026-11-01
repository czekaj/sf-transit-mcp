# Departure board layout comparison

Offline design exploration only. Run `node scripts/preview-arrivals-layout.mjs` from the repository and open `http://127.0.0.1:8806`. The page makes no transit API calls and does not change the production widget.

**A was selected and implemented in the working widget.** Use `npm run preview:widget` and select **Caltrain departures** to check the implementation with example data, including different scheduled times and long service names.

- **A · Three-column board (recommended):** 13 service slots, 22 destination slots, 8 departure-time slots. Status sits below the time.
- **B · Destination-first:** 22 destination slots and 8 departure-time slots. Full service names sit below destinations as plain text.

Both preserve the charcoal board, 28px cells, red retrieved clock, and a green live dot beside the departure time. Duplicate scheduled times are omitted. The second live row includes a different scheduled time to show the distinction.

Controls outside the widget switch layouts, light/dark themes, Caltrain/BART/Muni example data, and a 360px preview. Container-responsive small layouts use whole-word plain text. The icon is loaded from `/assets/icon-256.png` on the local server. All rows are examples, labeled outside the widget.
