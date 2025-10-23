; Sample ZIL file for testing the converter

<ROOM WEST-OF-HOUSE
	(DESC "West of House")
	(LDESC "You are standing in an open field west of a white house, with a boarded front door. There is a small mailbox here.")
	(NORTH NORTH-OF-HOUSE)
	(SOUTH SOUTH-OF-HOUSE)
	(EAST BEHIND-HOUSE)>

<OBJECT MAILBOX
	(IN WEST-OF-HOUSE)
	(SYNONYM MAILBOX BOX)
	(ADJECTIVE SMALL)
	(DESC "small mailbox")
	(LDESC "A small mailbox is here.")
	(FLAGS CONTBIT OPENBIT)
	(CAPACITY 10)>

<OBJECT LEAFLET
	(IN MAILBOX)
	(SYNONYM LEAFLET PAPER PAMPHLET)
	(DESC "leaflet")
	(LDESC "A leaflet is here.")
	(FLAGS TAKEBIT READBIT)
	(TEXT "WELCOME TO ZORK!")>

<OBJECT LAMP
	(IN LIVING-ROOM)
	(SYNONYM LAMP LANTERN LIGHT)
	(ADJECTIVE BRASS)
	(DESC "brass lantern")
	(LDESC "There is a brass lantern (battery-powered) here.")
	(FLAGS TAKEBIT LIGHTBIT)>
