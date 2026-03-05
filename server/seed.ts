import "dotenv/config";
import { getPool, slugify } from "./db";
import { hashPassword } from "./auth";

const defaultCategories = [
  "Bunk Comfort",
  "Gear Reviews",
  "Apps & Tools",
  "Money & Home",
  "Health OTR",
];

const FUEL_HUB = `## The Biggest Expense in Trucking

Fuel is the single largest operating cost for most over-the-road drivers. Whether you're an owner-operator or running under a lease program, diesel eats a massive chunk of revenue every week. In early 2026, diesel prices sit around $3.90 per gallon nationally. For trucks averaging between 6 and 7 miles per gallon, that adds up fast.

Understanding what fuel actually costs — not just at the pump but per mile driven — is the foundation of smart load decisions.

## What Fuel Really Costs Per Mile

The easiest way to understand fuel costs is converting diesel price into cost per mile.

**Formula:** Fuel price ÷ MPG = fuel cost per mile

**Example:** $3.90 ÷ 6 MPG = **$0.65 per mile**

At $0.65 per mile, a 1,000-mile run costs $650 in fuel before you account for anything else. That number changes significantly based on your actual MPG. A driver getting 6.5 MPG instead of 6 MPG saves about $0.05 per mile — which sounds small until you multiply it across 100,000 annual miles.

## The Annual Fuel Bill for OTR Drivers

Drivers running 100,000 miles per year at 6 MPG will burn about 16,600 gallons of diesel.

At $3.90 per gallon, that equals roughly **$65,000 in annual fuel cost**.

For context, that is more than many drivers gross in a year. Fuel is not a background expense — it is the main event.

Here is how those numbers break down at different MPG levels:

| MPG | Gallons/Year (100k mi) | Cost at $3.90/gal |
|-----|------------------------|-------------------|
| 5.5 | 18,182 | $70,909 |
| 6.0 | 16,667 | $65,000 |
| 6.5 | 15,385 | $59,999 |
| 7.0 | 14,286 | $55,715 |

The difference between 6 MPG and 7 MPG over 100,000 miles is more than $9,000 per year.

## Fuel Prices Change — Your Math Has to Keep Up

Diesel does not stay at $3.90. It moves with markets, seasons, and supply disruptions. A 10-cent-per-gallon increase across a 100,000-mile year adds roughly $1,600 in fuel expense.

Drivers who track their cost per mile at current prices are better positioned to decide which loads are worth taking. For a deeper look at how diesel price swings hit your bottom line, read [How Rising Diesel Prices Affect OTR Profits](/post/how-rising-diesel-prices-affect-otr-profits).

## Idling Is a Silent Fuel Drain

Many drivers underestimate how much fuel disappears during stops. A typical Class 8 truck burns about 0.8 gallons per hour at idle. Across a 10-hour break, that is roughly $31 gone without turning a wheel.

Over a full year, idling can easily cost a driver $5,000 to $7,000. That is explored in detail in [The Hidden Costs of Idling Your Truck](/post/hidden-costs-idling-truck).

## Why MPG Is Worth Watching Closely

Fuel efficiency is not just about speed. Tire pressure, load weight, route terrain, wind resistance, and driving habits all affect MPG. Even a half-mile-per-gallon improvement can save thousands annually.

Read more about the specific factors that affect your numbers in [Why MPG Matters More Than You Think](/post/why-mpg-matters-otr-trucking).

## Use the Fuel Cost Calculator

Instead of guessing, you can calculate fuel costs for any trip in seconds.

**[Fuel Cost Calculator →](/tools/fuel-cost)**

Enter your miles, MPG, and current diesel price to see gallons used, total cost, and cost per mile. If you are planning a multi-stop run, start with your mileage first using the **[Multi-Stop Mileage Calculator →](/tools/mileage-calculator)**.

## Fuel Awareness Protects Profit

The difference between a profitable lane and a losing lane often comes down to fuel math. Drivers who know their cost per mile before they accept a load make better decisions. They know when a rate is too thin, when to push for a fuel surcharge, and when to pass on a load entirely.

Fuel is the cost you carry every mile. Understanding it is one of the most important things an OTR driver can do for long-term financial health.`;

const IDLING = `## The Quiet Money Leak: Truck Idling

Most drivers know fuel is their biggest expense. Fewer stop to calculate how much of that fuel disappears without the truck moving an inch.

Modern Class 8 trucks burn roughly 0.8 gallons of diesel per hour while idling. At $3.90 per gallon, that is about **$3.12 per hour** going straight into the air through your exhaust stack.

## What a Single Night of Idling Costs

A typical 10-hour break can burn through about 8 gallons of diesel just keeping the cab warm or cool.

At current prices, that is roughly **$31 per night** in fuel — with no miles driven and no revenue generated.

## The Annual Cost Adds Up Fast

If a driver idles through 200 nights per year — not unusual for long-haul OTR runs — that adds up to roughly **$6,200 in idle fuel costs** annually.

| Nights Idling/Year | Cost at $3.90/gal |
|--------------------|-------------------|
| 100 nights | ~$3,100 |
| 150 nights | ~$4,650 |
| 200 nights | ~$6,200 |
| 250 nights | ~$7,750 |

## Why Drivers Idle

Idling is not laziness — it is a legitimate need. Cab temperature during summer heat or winter cold can become a safety issue. Diesel APUs, battery systems, and shore power are alternatives, but they require investment or access.

The point is not to eliminate idling entirely but to understand its real cost and make informed decisions about when it is necessary.

## How Idling Affects Your MPG Numbers

If you are tracking fuel economy by dividing total miles by total gallons, idle time quietly drags your numbers down. A truck that logs 6.5 MPG on the highway might show 5.8 MPG over a week with heavy idling.

That gap matters when you are calculating cost per mile. For a full breakdown of why MPG is worth tracking carefully, read [Why MPG Matters More Than You Think](/post/why-mpg-matters-otr-trucking).

## Idling Is Part of the Bigger Fuel Picture

Idling is one piece of a larger fuel cost equation. Drivers who want to understand the full picture — cost per mile, annual fuel spend, and how diesel price changes affect profits — should start with [How Much Fuel Really Costs an OTR Driver in 2026](/post/how-much-fuel-costs-otr-driver-2026).

## Calculate the Real Cost

**[Fuel Cost Calculator →](/tools/fuel-cost)**

Enter your estimated trip miles and actual diesel price to see how much fuel is going toward miles driven versus idle time.

## Small Changes, Real Savings

Cutting even 50 idle nights per year — through better parking planning, a blanket and cracked window on mild nights, or pre-cooling the cab before shutting down — can save over $1,500 annually.

Combined with better MPG habits and smarter fuel stops, small changes stack up into meaningful money kept in your pocket at the end of the year.`;

const MPG = `## A Half MPG Makes a Real Difference

Most drivers have a rough idea of their truck's fuel economy. Fewer have done the math on what even a modest improvement means in actual dollars.

A truck running 100,000 miles at 6 MPG burns about **16,667 gallons** of diesel per year.

Improve that to 6.5 MPG and you burn only **15,385 gallons** — a savings of roughly **1,282 gallons**.

At $3.90 per gallon, that half-MPG improvement is worth about **$5,000 per year**.

## Where Drivers Lose MPG

Fuel efficiency does not disappear all at once. It bleeds away through a combination of habits and conditions that most drivers accept as normal.

**Speed** is the biggest single factor. Aerodynamic drag increases exponentially with speed. Most Class 8 trucks reach peak fuel efficiency somewhere between 55 and 62 mph. Running at 70 mph instead of 62 mph can drop fuel economy by 1 MPG or more.

**Idle time** pulls down your overall numbers. If you track fuel economy by dividing total gallons by total miles, every hour idling adds gallons without adding miles. Read more about the real cost of idling in [The Hidden Costs of Idling Your Truck](/post/hidden-costs-idling-truck).

**Aggressive acceleration** wastes fuel on every startup. Gradual acceleration out of stops and slow traffic allows the engine to build momentum efficiently.

**Tire pressure** matters more than most drivers realize. Under-inflated tires increase rolling resistance, which increases fuel consumption.

**Route terrain** affects fuel economy in ways dispatch systems do not always account for. Mountain routes, headwind corridors, and heavy urban traffic all reduce efficiency.

## Convert MPG Into Cost Per Mile

The most useful number is not MPG itself — it is what MPG means for your cost per mile.

**Formula:** Fuel price ÷ MPG = cost per mile

| MPG | Cost Per Mile at $3.90/gal |
|-----|---------------------------|
| 5.5 | $0.709 |
| 6.0 | $0.650 |
| 6.5 | $0.600 |
| 7.0 | $0.557 |

The difference between 5.5 and 7.0 MPG is about $0.15 per mile. Across 100,000 miles, that is $15,000 per year.

For a complete look at how diesel costs add up across a full year, see [How Much Fuel Really Costs an OTR Driver in 2026](/post/how-much-fuel-costs-otr-driver-2026).

## How Diesel Price Changes Affect MPG Value

When diesel prices rise, the value of good fuel economy increases. Fuel price swings and their impact on OTR profits are covered in detail in [How Rising Diesel Prices Affect OTR Profits](/post/how-rising-diesel-prices-affect-otr-profits).

## Measure Your Own Numbers

The best MPG figure is not the one in your truck spec sheet — it is the one you calculate from your actual fuel receipts.

Track gallons purchased and miles driven over several weeks. Divide total miles by total gallons. Compare that number month to month.

**[Fuel Cost Calculator →](/tools/fuel-cost)**

Use it to see exactly how your current MPG and diesel price translate into cost per mile — and what improving your efficiency would save you.`;

const DIESEL_PRICES = `## Diesel Prices Drive Profit or Kill It

Fuel price swings are one of the most unpredictable forces in OTR trucking. Unlike load rates, which drivers can negotiate, diesel prices move with markets beyond anyone's control.

Understanding how a price change at the pump translates into real dollars on a year's worth of miles is essential for any driver managing their own finances.

## Cost Per Mile Math When Prices Move

At the core, fuel cost per mile is simple: **diesel price ÷ MPG**.

| Diesel Price | Cost/Mile at 6 MPG | Cost/Mile at 6.5 MPG |
|---|---|---|
| $3.50 | $0.583 | $0.538 |
| $3.90 | $0.650 | $0.600 |
| $4.10 | $0.683 | $0.631 |
| $4.50 | $0.750 | $0.692 |

The jump from $3.50 to $4.10 diesel increases cost per mile by $0.10 at 6 MPG. Across 120,000 miles, that is **$12,000 in extra annual fuel expense** — without any change in your routes, loads, or habits.

## A 10-Cent Swing Is Never Just 10 Cents

A 10-cent increase per gallon at 6 MPG:
- Increases cost per mile by $0.017
- Costs an extra $1,700 per 100,000 miles
- Costs an extra $2,040 per 120,000 miles

For a full picture of what diesel costs across an entire year, read [How Much Fuel Really Costs an OTR Driver in 2026](/post/how-much-fuel-costs-otr-driver-2026).

## Fuel Surcharges Do Not Always Cover the Gap

Many freight contracts include fuel surcharge provisions, but they are often based on national diesel averages and calculated weekly. When prices spike quickly, the surcharge lags behind the real cost.

Owner-operators running spot freight have even less protection. If you accept a load at a flat rate and diesel jumps before delivery, the gap comes out of your pocket.

## How Better MPG Protects Against Price Swings

When diesel prices rise, the value of every MPG improvement increases. For a full breakdown of how MPG affects your bottom line, see [Why MPG Matters More Than You Think](/post/why-mpg-matters-otr-trucking).

## Plan Loads With Fuel Cost in Mind

Before accepting a load, savvy drivers calculate the fuel cost for that specific run. For multi-stop loads, accurate mileage is the starting point.

**[Multi-Stop Mileage Calculator →](/tools/mileage-calculator)**

Then run those miles through the fuel calculator to see what the load will actually cost in diesel.

**[Fuel Cost Calculator →](/tools/fuel-cost)**

## Work the Numbers Before the Load Moves

Diesel price is outside your control. Knowing your cost per mile at any given price is not. Running that math before every load is one of the simplest ways to protect your margin when markets move against you.`;

const ROUTE_HUB = `## Why Trip Planning Separates Good Weeks From Bad Ones

Over-the-road trucking runs on planning. Miles, time, fuel, and parking all have to line up so a week on the road stays predictable and HOS-legal. Drivers who treat trip planning like a small logistics project consistently have fewer surprises and more profitable weeks.

A solid planning routine covers five areas: mileage, ETA, fuel, parking, and route logging. Each one feeds into the others.

## Step 1: Get Accurate Mileage First

Every good trip plan starts with real road miles — not dispatch estimates and not optimistic GPS distances.

Real-world routes change because of traffic, restricted highways, low bridges, and detours. Even a 150-mile error in a route estimate can mean unexpected fuel cost and HOS pressure.

**[Multi-Stop Mileage Calculator →](/tools/mileage-calculator)**

Accurate miles allow you to estimate fuel usage, drive time, and parking needs before you leave the yard. Why this matters in detail is covered in [Why Accurate Mileage Matters More Than You Think in OTR Trucking](/post/why-accurate-mileage-matters-otr-trucking).

## Step 2: Plan Your ETA Across Time Zones

Long trips often cross multiple time zones, and appointment mistakes from time zone confusion are more common than most drivers admit.

ETA calculations depend on miles, realistic average speed, fuel stops, traffic buffers, and time zone shifts.

**[ETA + Time Zone Helper →](/tools/eta-timezone)**

For a detailed breakdown of how ETA mistakes happen and how to prevent them, read [How Time Zones and ETA Mistakes Can Ruin a Trucking Schedule](/post/how-time-zones-eta-mistakes-ruin-trucking-schedule).

## Step 3: Estimate Fuel Cost Before the Load Moves

Diesel prices change frequently, and a load that pencils out at $3.90 diesel may not at $4.30. Smart drivers run fuel numbers before accepting loads — not after.

**[Fuel Cost Calculator →](/tools/fuel-cost)**

For a complete picture of how fuel costs add up across a week, a month, and a year, see [How Much Fuel Really Costs an OTR Driver in 2026](/post/how-much-fuel-costs-otr-driver-2026).

## Step 4: Think About Parking Before You Need It

Parking strategy is one area where planning ahead pays large dividends. Truck parking is scarce in many corridors, and drivers who wait until HOS forces them to stop often find themselves circling for 45 minutes.

Identifying likely stopping points early — based on realistic drive time and known rest areas or truck stops on the route — reduces stress and protects hours.

## Step 5: Log the Trip While It Is Fresh

Every trip teaches something. The route that backed up near a particular city at a certain time of day. The truck stop that was always full by 8 PM. The fuel stop that was cheaper than anything else on that corridor.

Without a log, those lessons disappear. With a log, they build into a personal database of route knowledge.

**[Route Log Tool →](/tools/route-log)**

Why logging matters for long-term route optimization is covered in [Why Smart Truck Drivers Keep Route Logs for Every Trip](/post/why-truck-drivers-keep-route-logs).

## Planning Turns Chaotic Weeks Into Systems

The difference between a driver who consistently has smooth weeks and one who is constantly reacting to problems is usually planning. Not more experience — planning.

When you know your miles, your ETA, your fuel cost, your likely parking spots, and you log the trip afterward, you turn one-off decisions into a repeatable system. The road stays unpredictable. Your approach to it does not have to be.`;

const MILEAGE = `## Every Trip Starts With Miles — Get Them Right

Every trucking trip begins with a mileage estimate. If that number is wrong, everything built on top of it becomes wrong too: fuel estimates, drive time calculations, HOS planning, and delivery commitments.

Dispatch systems, GPS apps, and load boards all produce mileage estimates. The problem is that those numbers are starting points, not guarantees. Real-world routes shift because of traffic, terrain, restricted roads, detours, and weight limits.

## When the Miles Are Wrong, Everything Is Wrong

Consider a run estimated at 2,050 miles where the actual route turns out to be 2,200 miles. That 150-mile difference:

- Adds about **23 gallons of fuel** at 6.5 MPG
- Costs roughly **$90 in extra diesel** at $3.90 per gallon
- Adds roughly **2.5 to 3 hours** of driving time
- Can trigger HOS pressure if not accounted for in advance

## Why Dispatch Estimates Are Not Always Accurate

Dispatch systems optimize for common carrier routes. They may not account for your specific truck restrictions, preferred truck-route corridors, or real-time road conditions. Some systems use routing algorithms built for passenger cars. Neither reliably reflects what a loaded Class 8 truck will actually travel.

## Double-Check Routes Before You Leave

**[Multi-Stop Mileage Calculator →](/tools/mileage-calculator)**

Entering your actual stops — not just origin and destination — gives you a more accurate picture of total road miles. If the route has three or four stops, each leg needs to be calculated, not just the full trip estimate.

## Mileage Is the Foundation of Fuel Cost

At current diesel prices around $3.90 per gallon and roughly 6.5 MPG average, each mile costs about $0.60 in fuel. A 150-mile underestimate equals $90 in unplanned fuel expense.

For a complete breakdown of how fuel costs add up by the mile, trip, and year, read [How Much Fuel Really Costs an OTR Driver in 2026](/post/how-much-fuel-costs-otr-driver-2026).

## Mileage, ETA, and Fuel Planning Work Together

Accurate mileage feeds into everything downstream. Once you have real miles, you can estimate drive time, identify parking opportunities on the route, and calculate fuel cost for the specific run.

For drivers planning longer runs or week-long routes, mileage verification is the first step in the broader planning process covered in [How OTR Drivers Plan a Week-Long Route Without Losing Hours](/post/how-otr-drivers-plan-week-long-route).

## Treat the Estimate as a Starting Point, Not the Answer

Mileage estimates from any source — dispatch, GPS, or load boards — are inputs to refine, not figures to trust blindly. The five minutes spent verifying a route before departure can save hours of problems once the load is moving.`;

const ETA = `## Time Zones Can Silently Destroy a Trucking Schedule

Most drivers know how to estimate drive time. Fewer account carefully for time zone changes — and the ones who do not often discover the error at the delivery dock.

A driver leaving Florida heading for a delivery in Chicago crosses from Eastern to Central Time. If the appointment is at 9:00 AM Central and the driver calculates arrival in Eastern Time, they believe they have an extra hour they do not have. They arrive late.

## Why ETA Calculations Go Wrong

An ETA estimate depends on several variables that all have to be correct at the same time:

- **Total miles** — If the route mileage is wrong, the drive time is wrong before you even start. For more on why accurate mileage is the foundation of good trip planning, see [Why Accurate Mileage Matters More Than You Think in OTR Trucking](/post/why-accurate-mileage-matters-otr-trucking).
- **Realistic average speed** — Not posted speed limits. Real average speeds including slowdowns, urban traffic, and construction.
- **Fuel stops** — A standard fuel stop costs 20 to 40 minutes. Multi-stop runs have multiple fuel stops.
- **Traffic and city congestion** — Major metro areas regularly add 30 to 90 minutes.
- **Time zone shifts** — Every zone boundary changes the clock, and appointment times are always in the receiver's local time.

## The Buffer Rule Most Experienced Drivers Use

Drivers who rarely miss appointments tend to build explicit buffers into their ETA math — not because they plan to be slow, but because they plan for reality.

A common approach: calculate the optimistic drive time, then add 15 percent for traffic and delays, then add a final 30-minute buffer on top. If the math shows arrival at 8:15 AM with the appointment at 9:00 AM, that is a comfortable window. If the math shows 9:05 AM, the driver either adjusts or calls ahead — not while driving with a late delivery looming.

## Using an ETA Tool to Get the Math Right

**[ETA + Time Zone Helper →](/tools/eta-timezone)**

This tool lets you enter departure time, driving hours, breaks, and time zone shift to calculate a realistic arrival time — in the receiving time zone, not yours.

## ETA Planning Fits Into Broader Trip Planning

Getting the ETA right is one step in a complete trip planning routine that also covers mileage verification, fuel cost estimation, parking strategy, and route logging. For the full approach, read [How OTR Drivers Plan a Week-Long Route Without Losing Hours](/post/how-otr-drivers-plan-week-long-route).

## Missing Appointments Has Real Costs

A missed appointment is not just inconvenient. It creates detention time disputes, service failure records, and sometimes chargebacks. Repeat late deliveries can cost a driver preferred lane access or broker relationships.

Preventing appointment problems costs a few minutes of planning before departure. Using the ETA tool consistently makes late arrivals the exception instead of the pattern.`;

const ROUTE_LOG = `## Every Trip Teaches Something — But Only If You Write It Down

Experienced drivers carry a lot of knowledge in their heads. Which corridors back up on Sunday afternoons. Which truck stops fill by 9 PM on a Friday. Which city always adds an hour regardless of what the GPS says.

The problem is that this knowledge lives only in memory. Six months later, on a lane you have not run in a while, the details have faded. You make the same mistakes again.

Route logs solve this problem.

## What a Route Log Captures

A useful route log does not need to be complex. The goal is capturing the information that would have been useful to know before the trip started.

A complete log entry typically includes:

- Start and end points with dates and times
- Total miles driven (actual, not estimated)
- Fuel stops with locations and prices paid
- Traffic delays with locations and approximate durations
- Parking stops with notes on availability and quality
- Delivery times versus appointment times
- Any detours, road issues, or unexpected events

Over time, these entries build a personal database of route knowledge that no app or dispatch system can replicate.

## How Logs Improve Future Trips

The value of a route log compounds with repetition. The first time you run a lane, the log captures raw data. The second time, you can review what happened before and plan around it. By the fifth time, you know that lane the way a local knows their commute.

A driver running Georgia to Illinois regularly might notice:

- A specific stretch near Louisville always adds 45 minutes on Monday mornings
- Fuel at a particular stop in Indiana is consistently $0.12 cheaper than the next exit
- Parking fills early at a certain rest area and late at a nearby truck stop

None of that knowledge appears in a GPS or dispatch system. It comes from accumulated experience — and a log is how you keep it.

## Logs Help You Optimize Mileage Over Time

Actual miles versus estimated miles is one of the most useful data points a route log can capture. If you consistently find that real miles run 5 to 10 percent higher than dispatch estimates, you can factor that into your planning automatically.

For context on why mileage accuracy matters so much, read [Why Accurate Mileage Matters More Than You Think in OTR Trucking](/post/why-accurate-mileage-matters-otr-trucking).

## Route Logs Are Part of a Complete Planning System

Logging a trip is the final step in a planning routine that starts before departure and captures what actually happened for use on the next run. That complete routine is covered in [How OTR Drivers Plan a Week-Long Route Without Losing Hours](/post/how-otr-drivers-plan-week-long-route).

## Keep the Log Where You Will Actually Use It

**[Route Log Tool →](/tools/route-log)**

Use it to record trip details while they are fresh — right after delivery or during a break — so the information is accurate when you need it months later.

## Start With One Trip

If you have never kept a route log, start with your next run. Record the basics: miles, fuel stops, any delays, parking. After a few trips, the habit forms and the entries get more useful. After a season, the log becomes one of the most valuable tools a driver has — and it costs nothing to build except a few minutes of attention after each run.`;

interface SeedPost {
  title: string;
  slug: string;
  excerpt: string;
  content_md: string;
  meta_title: string;
  meta_description: string;
  categoryName: string;
  publishedAt: string;
}

const DEFAULT_POSTS: SeedPost[] = [
  {
    title: "How Much Fuel Really Costs an OTR Driver in 2026",
    slug: "how-much-fuel-costs-otr-driver-2026",
    excerpt: "Fuel is the biggest operating expense in trucking. Here is what diesel actually costs per mile, per year, and what it means for your profits.",
    content_md: FUEL_HUB,
    meta_title: "How Much Fuel Really Costs an OTR Driver in 2026 | OTR Life",
    meta_description: "Diesel costs broken down by the mile, the trip, and the year. Use real numbers to protect your profit margin on every load.",
    categoryName: "Money & Home",
    publishedAt: "2026-03-05T13:00:00Z",
  },
  {
    title: "The Hidden Costs of Idling Your Truck",
    slug: "hidden-costs-idling-truck",
    excerpt: "Your truck burns about 0.8 gallons per hour at idle. Over 200 nights a year, that quiet habit costs more than $6,000 in fuel you never earned back.",
    content_md: IDLING,
    meta_title: "The Hidden Costs of Idling Your Truck | OTR Life",
    meta_description: "Idling costs OTR drivers thousands per year in diesel. Learn what it actually costs per night and per year, and how to think about reducing it.",
    categoryName: "Money & Home",
    publishedAt: "2026-03-05T13:01:00Z",
  },
  {
    title: "Why MPG Matters More Than You Think in OTR Trucking",
    slug: "why-mpg-matters-otr-trucking",
    excerpt: "A half-MPG improvement saves around $5,000 per year at current diesel prices. Here is where drivers lose fuel efficiency and how to measure your real numbers.",
    content_md: MPG,
    meta_title: "Why MPG Matters More Than You Think in OTR Trucking | OTR Life",
    meta_description: "Better fuel economy means thousands of dollars saved annually. Learn what affects MPG, how to calculate cost per mile, and how to track your real numbers.",
    categoryName: "Money & Home",
    publishedAt: "2026-03-05T13:02:00Z",
  },
  {
    title: "How Rising Diesel Prices Affect OTR Profits",
    slug: "how-rising-diesel-prices-affect-otr-profits",
    excerpt: "A 10-cent diesel increase costs over $1,700 per 100,000 miles. Here is how price swings translate into real dollars and how to plan around them.",
    content_md: DIESEL_PRICES,
    meta_title: "How Rising Diesel Prices Affect OTR Profits | OTR Life",
    meta_description: "When diesel prices rise, the math changes fast. Learn how price swings affect cost per mile and what OTR drivers can do to protect their margins.",
    categoryName: "Money & Home",
    publishedAt: "2026-03-05T13:03:00Z",
  },
  {
    title: "How OTR Drivers Plan a Week-Long Route Without Losing Hours",
    slug: "how-otr-drivers-plan-week-long-route",
    excerpt: "The best OTR weeks are planned before the first mile turns. Here is the five-step routine experienced drivers use to manage mileage, ETA, fuel, parking, and route logs.",
    content_md: ROUTE_HUB,
    meta_title: "How OTR Drivers Plan a Week-Long Route Without Losing Hours | OTR Life",
    meta_description: "A practical trip planning routine for OTR drivers covering mileage, ETA, fuel estimation, parking strategy, and route logging.",
    categoryName: "Apps & Tools",
    publishedAt: "2026-03-05T13:04:00Z",
  },
  {
    title: "Why Accurate Mileage Matters More Than You Think in OTR Trucking",
    slug: "why-accurate-mileage-matters-otr-trucking",
    excerpt: "If the miles are wrong, everything is wrong. A 150-mile route error can cost $90 in extra fuel and derail your HOS. Here is why verifying mileage before departure is worth the five minutes.",
    content_md: MILEAGE,
    meta_title: "Why Accurate Mileage Matters More Than You Think in OTR Trucking | OTR Life",
    meta_description: "Mileage errors compound into fuel overruns, late arrivals, and HOS problems. Learn why drivers verify their routes and how to do it before the load moves.",
    categoryName: "Apps & Tools",
    publishedAt: "2026-03-05T13:05:00Z",
  },
  {
    title: "How Time Zones and ETA Mistakes Can Ruin a Trucking Schedule",
    slug: "how-time-zones-eta-mistakes-ruin-trucking-schedule",
    excerpt: "Crossing one time zone boundary can make a driver think they have an extra hour they do not. Here is how ETA mistakes happen and how to calculate arrival times correctly.",
    content_md: ETA,
    meta_title: "How Time Zones and ETA Mistakes Can Ruin a Trucking Schedule | OTR Life",
    meta_description: "Time zone confusion causes late deliveries that damage broker relationships. Learn how to calculate ETA correctly across time zones and build in the right buffers.",
    categoryName: "Apps & Tools",
    publishedAt: "2026-03-05T13:06:00Z",
  },
  {
    title: "Why Smart Truck Drivers Keep Route Logs for Every Trip",
    slug: "why-truck-drivers-keep-route-logs",
    excerpt: "Every trip teaches something. Without a log, those lessons disappear. Here is what experienced drivers record after each run and how that knowledge improves every trip that follows.",
    content_md: ROUTE_LOG,
    meta_title: "Why Smart Truck Drivers Keep Route Logs for Every Trip | OTR Life",
    meta_description: "Route logs turn driving experience into reusable knowledge. Learn what to record after each trip and how to use that data to plan better routes over time.",
    categoryName: "Apps & Tools",
    publishedAt: "2026-03-05T13:07:00Z",
  },
];

async function seedDefaultPosts(): Promise<void> {
  const db = getPool();

  const catResult = await db.query(
    `SELECT name, id FROM categories WHERE name = ANY($1)`,
    [["Money & Home", "Apps & Tools"]],
  );
  const catMap: Record<string, number> = {};
  for (const row of catResult.rows) {
    catMap[row.name as string] = row.id as number;
  }

  let inserted = 0;
  for (const post of DEFAULT_POSTS) {
    const categoryId = catMap[post.categoryName] ?? null;
    const result = await db.query(
      `INSERT INTO posts
         (title, slug, excerpt, content_md, status, published_at, created_at, updated_at,
          meta_title, meta_description, category_id)
       VALUES ($1,$2,$3,$4,'published',$5,NOW(),NOW(),$6,$7,$8)
       ON CONFLICT (slug) DO NOTHING
       RETURNING id`,
      [
        post.title,
        post.slug,
        post.excerpt,
        post.content_md,
        post.publishedAt,
        post.meta_title,
        post.meta_description,
        categoryId,
      ],
    );
    if ((result.rowCount ?? 0) > 0) inserted++;
  }
  console.log(`[seed] Default posts: ${inserted} inserted, ${DEFAULT_POSTS.length - inserted} already existed.`);
}

export async function runSeed(): Promise<void> {
  const db = getPool();

  const userResult = await db.query("SELECT COUNT(*) AS c FROM users");
  const userCount = Number(userResult.rows[0]?.c ?? 0);

  if (userCount === 0) {
    const adminUser = (process.env.ADMIN_USER || "admin").trim();
    const adminPass = (process.env.ADMIN_PASS || "changeme123").trim();

    if (!process.env.ADMIN_USER || !process.env.ADMIN_PASS) {
      console.warn("[seed] ADMIN_USER/ADMIN_PASS not set, using temporary defaults.");
    }

    const passwordHash = hashPassword(adminPass);
    await db.query("INSERT INTO users (username, password_hash) VALUES ($1, $2)", [adminUser, passwordHash]);
    console.log(`[seed] Admin user created: ${adminUser}`);
  }

  for (const name of defaultCategories) {
    const slug = slugify(name);
    await db.query("INSERT INTO categories (name, slug) VALUES ($1, $2) ON CONFLICT (slug) DO NOTHING", [name, slug]);
  }
  console.log("[seed] Default categories ensured.");

  await seedDefaultPosts();
}

if (require.main === module) {
  runSeed().then(() => {
    console.log("[seed] Complete.");
    process.exit(0);
  }).catch((err) => {
    console.error("[seed] Error:", err);
    process.exit(1);
  });
}
