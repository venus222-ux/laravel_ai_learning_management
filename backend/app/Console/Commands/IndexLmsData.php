<?php

namespace App\Console\Commands;

use App\Models\Course;
use App\Models\Lesson;
use App\Services\AiFeatureService;
use Elastic\Elasticsearch\ClientBuilder;
use Illuminate\Console\Command;

class IndexLmsData extends Command  //Această clasă conține o comandă de consolă (lms:index) pe care programatorul o rulează pentru a „pregăti” datele.
{
    protected $signature = 'lms:index {--fresh : Drop and recreate the indices before indexing}';
    protected $description = 'Generate embeddings and index Courses and Lessons into Elasticsearch';

    protected $client;
    protected $ai;

    public function __construct(AiFeatureService $aiFeatureService)
    {
        parent::__construct();

        $this->client = ClientBuilder::create()
            ->setHosts(['http://127.0.0.1:9200']) // Ensure it's http
            ->setSSLVerification(false)          // Disable SSL verification
            ->build();

        $this->ai = $aiFeatureService;
    }

    public function handle()
    {
        if ($this->option('fresh')) {
            $this->recreateIndex('courses');
            $this->recreateIndex('lessons');
        }

        $this->info('Starting Course Indexing...');
        $this->indexCourses();

        $this->info('Starting Lesson Indexing...');
        $this->indexLessons();

        $this->info('✅ All LMS data successfully indexed!');
    }

    protected function indexCourses()
    {
        // Chunk to avoid memory limits on large datasets
        Course::chunk(50, function ($courses) {
            foreach ($courses as $course) {
                $this->info("Indexing Course: {$course->title}");

                // Combine relevant text for the embedding
                $textToEmbed = "Course Title: {$course->title}. Description: {$course->description}";
                $embedding = $this->ai->generateEmbedding($textToEmbed);

                $this->client->index([
                    'index' => 'courses',
                    'id'    => $course->id,
                    'body'  => [
                        'title'       => $course->title,
                        'description' => $course->description,
                        'type'        => 'course',
                        'embedding'   => $embedding, // The 1536-dimensional float array
                    ]
                ]);
            }
        });
    }

    protected function indexLessons()
    {
        Lesson::chunk(50, function ($lessons) {
            foreach ($lessons as $lesson) {
                $this->info("Indexing Lesson: {$lesson->title}");

                // You can include the lesson content if it's not too large for the token limit
                $textToEmbed = "Lesson Title: {$lesson->title}. Content: " . strip_tags($lesson->content);
                $embedding = $this->ai->generateEmbedding($textToEmbed);

                $this->client->index([
                    'index' => 'lessons',
                    'id'    => $lesson->id,
                    'body'  => [
                        'title'     => $lesson->title,
                        'content'   => $lesson->content,
                        'course_id' => $lesson->course_id,
                        'type'      => 'lesson',
                        'embedding' => $embedding,
                    ]
                ]);
            }
        });
    }

    protected function recreateIndex(string $indexName)
    {
        $this->warn("Recreating mapping for index: {$indexName}");

        try {
            if ($this->client->indices()->exists(['index' => $indexName])->asBool()) {
                $this->client->indices()->delete(['index' => $indexName]);
            }
        } catch (\Exception $e) {
            // Ignore if it doesn't exist
        }

        // Create index with k-NN dense vector mapping
        $this->client->indices()->create([
            'index' => $indexName,
            'body'  => [
                'mappings' => [
                    'properties' => [
                        'title'       => ['type' => 'text'],
                        'description' => ['type' => 'text'],
                        'content'     => ['type' => 'text'],
                        'type'        => ['type' => 'keyword'],
                        'course_id'   => ['type' => 'integer'],
                        'embedding'   => [
                            'type'       => 'dense_vector',
                            'dims'       => 768, // Must match your AI model's output dimensions
                            'index'      => true,
                            'similarity' => 'cosine' // Cosine similarity is best for OpenAI embeddings
                        ]
                    ]
                ]
            ]
        ]);
    }
}
