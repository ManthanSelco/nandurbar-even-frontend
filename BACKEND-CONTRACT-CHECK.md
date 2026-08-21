# Phase: Vendor + Government Scheme + Questions

Implemented against the supplied backend ZIP.

## Vendor
POST /vendors
GET /vendors
GET /vendors/:id
PATCH /vendors/:id
DELETE /vendors/:id
POST /vendors/import/csv
POST /vendors/:id/documents
POST /vendors/:id/links

Fields implemented:
name, geography, selcoEmpanelled, email, description, valueChain,
secondaryValueChain, relatedFields(interests, occupations, locations,
participantCategories), documents(name,url,type), importantLinks(title,url),
status.

## Government Schemes
POST /government-schemes
GET /government-schemes
GET /government-schemes/:id
PATCH /government-schemes/:id
DELETE /government-schemes/:id

Fields implemented:
schemeName, shortDescription, detailedDescription, department, ministry,
schemeType, category, status, officialWebsite, applicationLink, helplineNumber,
contactEmail, eligibility(genders,minAge,maxAge,occupations,locations,incomeRange,
categories,beneficiaryTypes,requiredDocuments,otherCriteria), relatedFields
(occupations,interests,locations,participantCategories,eventTypes), documents,
importantLinks.

## Questions
POST /participants/questions
GET /participants/questions
GET /participants/questions/:id
PATCH /participants/questions/:id
PATCH /participants/questions/:id/status
DELETE /participants/questions/:id

Fields implemented:
question, type(TEXT/TEXTAREA), required, minWords, maxWords, displayOrder,
isActive.

The public QR registration form now loads active questions dynamically and sends
answers as [{questionId, answer}].
