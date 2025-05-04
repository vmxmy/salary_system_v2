# Product Context

*Describe why this project exists, the problems it solves, how it should work, and user experience goals.*

**Problem:** Managing salary records derived from multiple Excel files is complex. Different employee 'establishment types' (编制类型) have varying salary structures (common and unique fields for job attributes and salary components). A centralized, structured, and access-controlled system is needed for accurate reporting and analysis.

**How it should work:** Excel data should be regularly loaded into a structured PostgreSQL database. A BI tool (Metabase) should allow for analysis and standard report generation. A web application should provide different user roles (Finance, Department Head, Employee) with access to only the salary reports and data they are authorized to see. 