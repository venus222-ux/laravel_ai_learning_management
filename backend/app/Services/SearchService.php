<?php

namespace App\Services;

use Elastic\Elasticsearch\ClientBuilder;
use Illuminate\Support\Facades\Log;

class SearchService
{
    protected $client;

    protected $aiFeatureService;

    public function __construct(AiFeatureService $aiFeatureService)
    {
        // Initialize Elasticsearch client
        $this->client = ClientBuilder::create()
            ->setHosts([env('ELASTICSEARCH_HOST', 'localhost:9200')])
            ->build();

        $this->aiFeatureService = $aiFeatureService;
    }

    public function search(string $query, string $type = 'standard')
    {
        if ($type === 'semantic') {
            return $this->semanticSearch($query);
        }

        return $this->standardSearch($query);
    }

    protected function standardSearch(string $query)
    {
        $params = [
            'index' => 'courses,lessons',
            'body' => [
                'query' => [
                    'multi_match' => [
                        'query' => $query,
                        'fields' => ['title^3', 'description', 'content'],
                        'fuzziness' => 'AUTO',
                    ],
                ],
            ],
        ];

        return $this->executeSearch($params);
    }

    protected function semanticSearch(string $query)
    {
        // 1. Generate the vector
        $vector = $this->aiFeatureService->generateEmbedding($query);

        // 2. Perform the k-NN search
        // We use the knn parameter at the top level, which is the standard 8.x approach
        $params = [
            'index' => 'courses,lessons',
            'body' => [
                'knn' => [
                    'field' => 'embedding',
                    'query_vector' => $vector,
                    'k' => 10,
                    'num_candidates' => 100,
                ],
                '_source' => ['title', 'description', 'content', 'course_id', 'type'],
            ],
        ];

        return $this->executeSearch($params);
    }

    protected function executeSearch(array $params)
    {
        try {
            $response = $this->client->search($params);

            // Format the Elasticsearch response for the frontend
            $hits = $response['hits']['hits'] ?? [];

            return array_map(function ($hit) {
                return [
                    'id' => $hit['_id'],
                    'index' => $hit['_index'],
                    'score' => $hit['_score'],
                    'data' => $hit['_source'],
                ];
            }, $hits);

        } catch (\Exception $e) {
            Log::error('Elasticsearch Query Failed: '.$e->getMessage());

            return [];
        }
    }
}
/**
 * semanticSearch: Acesta este „partea AI”. Nu caută cuvinte, ci concepte.
*  Trimite textul căutat către AiFeatureService pentru a-l transforma într-un vector
*  (o listă lungă de numere care reprezintă înțelesul matematic al cuvintelor).
*  Folosește metoda k-NN (k-Nearest Neighbors) pentru a găsi în baza de date
*  acele cursuri sau lecții ale căror „vectori” sunt cei mai apropiați matematic de vectorul întrebării tale.
 */

/***executeSearch: Este o funcție utilitară care curăță rezultatele primite de la Elasticsearch pentru a le trimite frumos către aplicația web. */
