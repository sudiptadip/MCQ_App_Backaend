/*
    Sample current affairs seed data.
    Run after deploying the CurrentAffairs schema/table. Safe to rerun: rows are
    matched by slug and existing records are left unchanged.
    Source summaries are original study notes; follow the linked PIB release.
*/
INSERT INTO [CurrentAffairs].[DailyCurrentAffairs]
(
    [AffairDate], [Title], [Slug], [Category], [ExamRelevance], [Excerpt], [ImageUrl],
    [HtmlContent], [TemplateKey], [SourceName], [SourceUrl], [Status], [IsFeatured],
    [PageTitle], [MetaTitle], [MetaDescription], [MetaKeywords], [CanonicalUrl], [PublishedOn]
)
SELECT seed.[AffairDate], seed.[Title], seed.[Slug], seed.[Category], seed.[ExamRelevance], seed.[Excerpt], seed.[ImageUrl],
       seed.[HtmlContent], seed.[TemplateKey], seed.[SourceName], seed.[SourceUrl], seed.[Status], seed.[IsFeatured],
       seed.[PageTitle], seed.[MetaTitle], seed.[MetaDescription], seed.[MetaKeywords], seed.[CanonicalUrl], SYSUTCDATETIME()
FROM (VALUES
    (
        CONVERT(DATE, '2026-10-03'),
        N'India demonstrates a 5.56 km free-space quantum key distribution link',
        N'india-quantum-key-distribution-link-5-56-km-2026',
        N'Science and Technology', N'High',
        N'India demonstrated a 5.56 km free-space quantum key distribution link. Review the basic idea behind quantum-secure key exchange and its relevance to secure communications.',
        CAST(NULL AS NVARCHAR(1000)),
        N'<h2>What happened?</h2><p>The Ministry of Electronics and Information Technology reported a 5.56 km free-space quantum key distribution (QKD) link demonstration in India.</p><h2>Quick revision</h2><ul><li>QKD is a method for establishing shared cryptographic keys using quantum states.</li><li>Its security properties can help reveal attempts to observe or intercept the quantum transmission.</li><li>The reported demonstration distance was 5.56 km over a free-space link.</li></ul><h2>Why it matters</h2><p>The development is relevant to questions on quantum technologies, cybersecurity and secure communication infrastructure. Refer to the PIB release for the official technical details.</p>',
        N'quick-revision', N'Press Information Bureau (PIB)',
        N'https://www.pib.gov.in/PressReleaseDetail.aspx?PRID=2318656&reg=48&lang=2',
        N'Published', CAST(1 AS BIT),
        N'India demonstrates 5.56 km quantum key distribution link | Current Affairs',
        N'Quantum Key Distribution Link: India’s 5.56 km Demonstration',
        N'Exam notes on India’s reported 5.56 km free-space quantum key distribution link demonstration and the basics of QKD.',
        N'quantum key distribution, QKD, quantum technology, cybersecurity, current affairs 2026', CAST(NULL AS NVARCHAR(1000))
    ),
    (
        CONVERT(DATE, '2026-10-03'),
        N'Ministry of Education approves five Centres of Excellence for classical-language studies',
        N'five-centres-excellence-classical-language-studies-2026',
        N'Education', N'Medium',
        N'The Ministry of Education approved five Centres of Excellence for studies in classical languages, highlighting institutional support for language research and scholarship.',
        CAST(NULL AS NVARCHAR(1000)),
        N'<h2>What happened?</h2><p>The Ministry of Education approved five Centres of Excellence for studies in classical languages.</p><h2>Why it matters</h2><p>The decision is relevant to questions on Indian languages, education policy and the preservation of cultural heritage. Centres of Excellence support focused academic work and research in their respective fields.</p><h2>Quick revision</h2><ul><li>Announcement: approval of five Centres of Excellence.</li><li>Area: studies in classical languages.</li><li>Ministry: Ministry of Education, Government of India.</li></ul><p>Check the linked PIB release for details about the centres and implementation.</p>',
        N'daily-brief', N'Press Information Bureau (PIB)',
        N'https://www.pib.gov.in/PressReleaseDetail.aspx?PRID=2318679&reg=48&lang=2',
        N'Published', CAST(0 AS BIT),
        N'Five Centres of Excellence for classical-language studies | Current Affairs',
        N'Education Ministry Approves Five Classical-Language Centres',
        N'Revise the Ministry of Education’s approval of five Centres of Excellence for studies in classical languages.',
        N'classical languages, Centres of Excellence, Ministry of Education, education current affairs', CAST(NULL AS NVARCHAR(1000))
    ),
    (
        CONVERT(DATE, '2026-10-03'),
        N'Reintroduction process for captive-bred Great Indian Bustards begins in Desert National Park',
        N'great-indian-bustard-captive-bred-release-desert-national-park-2026',
        N'Environment', N'High',
        N'A process to release captive-bred Great Indian Bustards into the wild was initiated at Desert National Park in Jaisalmer after conservation efforts spanning a decade.',
        CAST(NULL AS NVARCHAR(1000)),
        N'<h2>What happened?</h2><p>The Ministry of Environment, Forest and Climate Change reported the start of the process to release captive-bred Great Indian Bustards into the wild at Desert National Park, Jaisalmer.</p><h2>Quick revision</h2><ul><li>Species: Great Indian Bustard.</li><li>Location: Desert National Park, Jaisalmer, Rajasthan.</li><li>Context: a captive-breeding and conservation effort described as spanning ten years.</li></ul><h2>Why it matters</h2><p>The Great Indian Bustard is a critically endangered bird. This update is relevant to biodiversity, species conservation and protected areas. Consult the linked PIB release for the programme details.</p>',
        N'topic-explainer', N'Press Information Bureau (PIB)',
        N'https://www.pib.gov.in/PressReleaseDetail.aspx?PRID=2318629&reg=48&lang=2',
        N'Published', CAST(1 AS BIT),
        N'Great Indian Bustard conservation update at Desert National Park | Current Affairs',
        N'Great Indian Bustard Release Process Begins in Jaisalmer',
        N'Current affairs notes on the captive-bred Great Indian Bustard release process at Desert National Park, Jaisalmer.',
        N'Great Indian Bustard, Desert National Park, Jaisalmer, biodiversity, conservation, environment current affairs', CAST(NULL AS NVARCHAR(1000))
    ),
    (
        CONVERT(DATE, '2026-10-02'),
        N'2.42 lakh special Gram Sabhas take up citizen-centred initiatives across India',
        N'242000-special-gram-sabhas-citizen-centred-initiatives-2026',
        N'Governance', N'Medium',
        N'Special Gram Sabhas across India placed citizen-centred initiatives at the centre of grassroots discussions, with 2.42 lakh Gram Sabhas reported in the national update.',
        CAST(NULL AS NVARCHAR(1000)),
        N'<h2>What happened?</h2><p>A national update highlighted 2.42 lakh Special Gram Sabhas across India, focusing on citizen-centred initiatives and grassroots discussions.</p><h2>Quick revision</h2><ul><li>Institution: Gram Sabha, the village-level assembly of registered voters.</li><li>Scale reported: 2.42 lakh Special Gram Sabhas.</li><li>Exam link: Panchayati Raj, grassroots democracy and participatory governance.</li></ul><p>The linked PIB release provides the official context and details of the initiatives discussed.</p>',
        N'quick-revision', N'Press Information Bureau (PIB)',
        N'https://www.pib.gov.in/PressReleaseDetail.aspx?PRID=2318441&reg=48&lang=2',
        N'Published', CAST(0 AS BIT),
        N'2.42 lakh Special Gram Sabhas across India | Current Affairs',
        N'Special Gram Sabhas and Grassroots Governance in India',
        N'Revise the reported 2.42 lakh Special Gram Sabhas and their relevance to Panchayati Raj and grassroots democracy.',
        N'Gram Sabha, Panchayati Raj, grassroots democracy, participatory governance, current affairs 2026', CAST(NULL AS NVARCHAR(1000))
    ),
    (
        CONVERT(DATE, '2026-10-03'),
        N'Indian men’s hockey team retains gold at the Asian Games',
        N'indian-mens-hockey-team-retains-asian-games-gold-2026',
        N'Sports', N'Medium',
        N'The Prime Minister congratulated the Indian men’s hockey team for retaining gold at the Asian Games, an update relevant to sports current affairs and major international competitions.',
        CAST(NULL AS NVARCHAR(1000)),
        N'<h2>What happened?</h2><p>The Prime Minister congratulated the Indian men’s hockey team on retaining the gold medal at the Asian Games.</p><h2>Quick revision</h2><ul><li>Sport: field hockey.</li><li>Team: Indian men’s team.</li><li>Event: Asian Games.</li><li>Achievement: retained the gold medal.</li></ul><p>Use the official source for the event-specific details and team information.</p>',
        N'daily-brief', N'Press Information Bureau (PIB)',
        N'https://www.pib.gov.in/PressReleaseDetail.aspx?PRID=2318743&reg=48&lang=2',
        N'Published', CAST(0 AS BIT),
        N'Indian men’s hockey team retains Asian Games gold | Current Affairs',
        N'India Retains Men’s Hockey Gold at the Asian Games',
        N'Current affairs update: India’s men’s hockey team retains gold at the Asian Games.',
        N'Indian hockey, Asian Games, sports current affairs, India gold medal 2026', CAST(NULL AS NVARCHAR(1000))
    )
) AS seed
(
    [AffairDate], [Title], [Slug], [Category], [ExamRelevance], [Excerpt], [ImageUrl],
    [HtmlContent], [TemplateKey], [SourceName], [SourceUrl], [Status], [IsFeatured],
    [PageTitle], [MetaTitle], [MetaDescription], [MetaKeywords], [CanonicalUrl]
)
WHERE NOT EXISTS
(
    SELECT 1
    FROM [CurrentAffairs].[DailyCurrentAffairs] existing
    WHERE existing.[Slug] = seed.[Slug]
);
GO

SELECT [Id], [AffairDate], [Title], [Slug], [Category], [Status]
FROM [CurrentAffairs].[DailyCurrentAffairs]
WHERE [Slug] IN
(
    N'india-quantum-key-distribution-link-5-56-km-2026',
    N'five-centres-excellence-classical-language-studies-2026',
    N'great-indian-bustard-captive-bred-release-desert-national-park-2026',
    N'242000-special-gram-sabhas-citizen-centred-initiatives-2026',
    N'indian-mens-hockey-team-retains-asian-games-gold-2026'
)
ORDER BY [AffairDate] DESC, [Title];
GO
